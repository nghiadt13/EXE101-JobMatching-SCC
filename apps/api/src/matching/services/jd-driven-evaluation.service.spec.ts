import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppLogger } from '../../common/logging/app-logger.service';
import { AiNormalizationService } from '../../normalization/ai-normalization.service';
import { AiNormalizationError } from '../../normalization/normalization.errors';
import { JdDrivenEvaluationService } from './jd-driven-evaluation.service';
import {
  JD_CONTEXTUAL_EVAL_V1,
  MATCHING_SNAPSHOT_V2,
  RequirementsSchemaV2,
  REQUIREMENTS_SCHEMA_V2,
} from '../types/schema-matching.types';

describe('JdDrivenEvaluationService', () => {
  let service: JdDrivenEvaluationService;
  let logger: { info: jest.Mock; warn: jest.Mock };
  let aiNormalizationService: {
    evaluateCvAgainstJd: jest.Mock;
  };

  beforeEach(() => {
    logger = { info: jest.fn(), warn: jest.fn() };
    aiNormalizationService = { evaluateCvAgainstJd: jest.fn() };
    service = new JdDrivenEvaluationService(
      logger as unknown as AppLogger,
      aiNormalizationService as unknown as AiNormalizationService,
    );
  });

  it('scores met, partial, missing, and not_applicable requirements deterministically', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(
      evaluation({
        requirementEvaluations: [
          requirementEvaluation('critical-api', 'met'),
          requirementEvaluation('high-db', 'partial'),
          requirementEvaluation('medium-cloud', 'missing'),
          requirementEvaluation('low-mobile', 'not_applicable'),
        ],
        candidateSummary: candidateSummary({
          relevantExperienceMonths: 24,
          projectRelevance: {
            totalProjects: 1,
            relevantProjects: 1,
            relevanceScore: 90,
            highlights: ['API project'],
          },
        }),
      }),
    );

    const result = await service.evaluate({
      cvRawText: 'TypeScript API CV',
      requirementsSchema: schema(),
    });

    expect(result.finalScorePercent).toBe(73);
    expect(result.snapshot.version).toBe(MATCHING_SNAPSHOT_V2);
    expect(result.snapshot.scoreBreakdown).toEqual({
      skillScore: 63,
      constraintScore: 100,
      experienceBonus: 100,
      projectBonus: 90,
      final: 73,
    });
    expect(result.snapshot.strengths).toContain('API development');
    expect(result.snapshot.gaps).toContain('Cloud deployment');
  });

  it('flags failed hard constraints without rejecting the candidate', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(
      evaluation({
        constraintEvaluations: [
          { constraintId: 'constraint-degree', label: '', met: false, evidence: 'No degree listed' },
          { constraintId: 'constraint-language', label: '', met: true, evidence: 'English listed' },
        ],
      }),
    );

    const result = await service.evaluate({
      cvRawText: 'CV with English but no degree',
      requirementsSchema: schema(),
    });

    expect(result.finalScorePercent).toBeGreaterThan(0);
    expect(result.snapshot.constraintsFailed).toEqual(["Bachelor's degree"]);
    expect(result.snapshot.scoreBreakdown.constraintScore).toBe(50);
  });

  it('uses default project and neutral experience scores for sparse CV/JD data', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(
      evaluation({
        requirementEvaluations: [requirementEvaluation('critical-api', 'met')],
        candidateSummary: candidateSummary({
          relevantExperienceMonths: 0,
          projectRelevance: {
            totalProjects: 0,
            relevantProjects: 0,
            relevanceScore: 0,
            highlights: [],
          },
        }),
      }),
    );

    const result = await service.evaluate({
      cvRawText: 'TypeScript API CV',
      requirementsSchema: schema({
        requirements: [
          {
            id: 'critical-api',
            label: 'API development',
            category: 'skill',
            importance: 'critical',
            keywords: ['api'],
            minimumMonths: null,
          },
        ],
      }),
    });

    expect(result.snapshot.scoreBreakdown.experienceBonus).toBe(50);
    expect(result.snapshot.scoreBreakdown.projectBonus).toBe(30);
  });

  it('calls AI evaluation without RAG context by default', async () => {
    const requirementsSchema = schema();
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(evaluation());

    await service.evaluate({
      cvRawText: 'TypeScript API CV',
      requirementsSchema,
    });

    expect(aiNormalizationService.evaluateCvAgainstJd).toHaveBeenCalledWith(
      'TypeScript API CV',
      requirementsSchema,
    );
  });

  it('passes optional RAG context to AI evaluation', async () => {
    const requirementsSchema = schema();
    const ragContext =
      '- [skill_alias] ReactJS / React: ReactJS is an alias of React.';
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(evaluation());

    await service.evaluate({
      cvRawText: 'TypeScript API CV',
      requirementsSchema,
      ragContext,
    });

    expect(aiNormalizationService.evaluateCvAgainstJd).toHaveBeenCalledWith(
      'TypeScript API CV',
      requirementsSchema,
      ragContext,
    );
  });

  it('fills missing LLM requirement and constraint evaluations conservatively', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockResolvedValue(
      evaluation({
        requirementEvaluations: [requirementEvaluation('critical-api', 'met')],
        constraintEvaluations: [],
      }),
    );

    const result = await service.evaluate({
      cvRawText: 'TypeScript API CV',
      requirementsSchema: schema(),
    });

    const missing = result.snapshot.requirements.find(
      (item) => item.requirementId === 'high-db',
    );
    const missingConstraint = result.snapshot.constraints.find(
      (item) => item.constraintId === 'constraint-degree',
    );
    expect(missing?.status).toBe('missing');
    expect(missing?.confidence).toBe('low');
    expect(missingConstraint?.met).toBe(false);
    expect(result.snapshot.warnings).toContain(
      'AI response omitted some requirement evaluations.',
    );
    expect(result.snapshot.warnings).toContain(
      'AI response omitted some constraint evaluations.',
    );
  });

  it('maps AI service unavailable errors to ServiceUnavailableException', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockRejectedValue(
      new AiNormalizationError('service_unavailable', 'rate limited'),
    );

    await expect(
      service.evaluate({
        cvRawText: 'CV',
        requirementsSchema: schema(),
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(logger.warn).toHaveBeenCalledWith(
      'jd_driven_evaluation_failed',
      expect.objectContaining({ kind: 'service_unavailable' }),
    );
  });

  it('maps AI parse failures to UnprocessableEntityException', async () => {
    aiNormalizationService.evaluateCvAgainstJd.mockRejectedValue(
      new AiNormalizationError('parse_failed', 'invalid json'),
    );

    await expect(
      service.evaluate({
        cvRawText: 'CV',
        requirementsSchema: schema(),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

function schema(
  overrides: Partial<RequirementsSchemaV2> = {},
): RequirementsSchemaV2 {
  return {
    version: REQUIREMENTS_SCHEMA_V2,
    roleTitle: 'Backend Engineer',
    summary: 'Backend API role',
    requirements: [
      {
        id: 'critical-api',
        label: 'API development',
        category: 'skill',
        importance: 'critical',
        keywords: ['api'],
        minimumMonths: 24,
      },
      {
        id: 'high-db',
        label: 'Database design',
        category: 'skill',
        importance: 'high',
        keywords: ['database'],
        minimumMonths: null,
      },
      {
        id: 'medium-cloud',
        label: 'Cloud deployment',
        category: 'skill',
        importance: 'medium',
        keywords: ['cloud'],
        minimumMonths: null,
      },
      {
        id: 'low-mobile',
        label: 'Mobile experience',
        category: 'skill',
        importance: 'low',
        keywords: ['mobile'],
        minimumMonths: null,
      },
    ],
    constraints: [
      {
        id: 'constraint-degree',
        label: "Bachelor's degree",
        type: 'education',
        required: true,
      },
      {
        id: 'constraint-language',
        label: 'English communication',
        type: 'language',
        required: true,
      },
    ],
    locationPreference: null,
    warnings: [],
    ...overrides,
  };
}

function evaluation(
  overrides: Partial<{
    requirementEvaluations: ReturnType<typeof requirementEvaluation>[];
    constraintEvaluations: Array<{
      constraintId: string;
      label: string;
      met: boolean;
      evidence: string;
    }>;
    candidateSummary: ReturnType<typeof candidateSummary>;
    warnings: string[];
  }> = {},
) {
  return {
    version: JD_CONTEXTUAL_EVAL_V1,
    requirementEvaluations: [
      requirementEvaluation('critical-api', 'met'),
      requirementEvaluation('high-db', 'met'),
      requirementEvaluation('medium-cloud', 'met'),
      requirementEvaluation('low-mobile', 'met'),
    ],
    constraintEvaluations: [
      {
        constraintId: 'constraint-degree',
        label: '',
        met: true,
        evidence: 'Degree listed',
      },
      {
        constraintId: 'constraint-language',
        label: '',
        met: true,
        evidence: 'English listed',
      },
    ],
    candidateSummary: candidateSummary(),
    warnings: [],
    ...overrides,
  };
}

function requirementEvaluation(
  requirementId: string,
  status: 'met' | 'partial' | 'missing' | 'not_applicable',
) {
  return {
    requirementId,
    label: '',
    importance: 'medium' as const,
    category: 'general' as const,
    status,
    evidence: status === 'missing' ? [] : [`Evidence for ${requirementId}`],
    confidence: status === 'missing' ? ('low' as const) : ('high' as const),
  };
}

function candidateSummary(
  overrides: Partial<{
    headline: string;
    totalExperienceMonths: number;
    relevantExperienceMonths: number;
    skills: string[];
    location: { city: string; country: string } | null;
    projectRelevance: {
      totalProjects: number;
      relevantProjects: number;
      relevanceScore: number;
      highlights: string[];
    };
  }> = {},
) {
  return {
    headline: 'Backend Engineer',
    totalExperienceMonths: 36,
    relevantExperienceMonths: 36,
    skills: ['TypeScript', 'NestJS'],
    location: null,
    projectRelevance: {
      totalProjects: 1,
      relevantProjects: 1,
      relevanceScore: 80,
      highlights: ['Built a backend API'],
    },
    ...overrides,
  };
}
