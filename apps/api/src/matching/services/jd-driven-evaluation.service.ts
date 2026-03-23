import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppLogger } from '../../common/logging/app-logger.service';
import { AiNormalizationService } from '../../normalization/ai-normalization.service';
import { AiNormalizationError } from '../../normalization/normalization.errors';
import {
  IMPORTANCE_WEIGHTS,
  MATCHING_SNAPSHOT_V2,
  MatchingSnapshotV2,
  RequirementsSchemaV2,
  RequirementEvaluation,
  ConstraintEvaluation,
  CandidateSummary,
} from '../types/schema-matching.types';

@Injectable()
export class JdDrivenEvaluationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly aiNormalizationService: AiNormalizationService,
  ) {}

  async evaluate(input: {
    cvRawText: string;
    requirementsSchema: RequirementsSchemaV2;
  }): Promise<{ finalScorePercent: number; snapshot: MatchingSnapshotV2 }> {
    const { cvRawText, requirementsSchema } = input;

    let evaluation;
    try {
      evaluation = await this.aiNormalizationService.evaluateCvAgainstJd(
        cvRawText,
        requirementsSchema,
      );
    } catch (error) {
      if (error instanceof AiNormalizationError) {
        this.logger.warn('jd_driven_evaluation_failed', {
          kind: error.kind,
          code: error.code,
          reason: error.message,
        });
        if (error.kind === 'service_unavailable') {
          throw new ServiceUnavailableException({
            message:
              'AI evaluation service is unavailable. Please try again later.',
            details: { stage: 'jd_cv_evaluation' },
          });
        }
        throw new UnprocessableEntityException({
          message:
            'AI could not evaluate this CV against the job requirements.',
          details: { stage: 'jd_cv_evaluation' },
        });
      }
      throw error;
    }

    const {
      skillScore,
      constraintScore,
      experienceBonus,
      projectBonus,
      finalScore,
    } = this.scoreDeterministically(
      evaluation.requirementEvaluations,
      evaluation.constraintEvaluations,
      evaluation.candidateSummary,
      requirementsSchema,
    );

    const snapshot = this.buildSnapshot(
      evaluation.requirementEvaluations,
      evaluation.constraintEvaluations,
      evaluation.warnings,
      evaluation.candidateSummary,
      requirementsSchema,
      skillScore,
      constraintScore,
      experienceBonus,
      projectBonus,
      finalScore,
    );

    this.logger.info('jd_driven_evaluation_scored', {
      finalScore,
      skillScore,
      constraintScore,
      experienceBonus,
      projectBonus,
      requirementsCount: requirementsSchema.requirements.length,
      constraintsCount: requirementsSchema.constraints.length,
    });

    return { finalScorePercent: finalScore, snapshot };
  }

  private scoreDeterministically(
    requirementEvaluations: RequirementEvaluation[],
    constraintEvaluations: ConstraintEvaluation[],
    candidateSummary: CandidateSummary,
    schema: RequirementsSchemaV2,
  ): {
    skillScore: number;
    constraintScore: number;
    experienceBonus: number;
    projectBonus: number;
    finalScore: number;
  } {
    // skill_score: weighted average (skip not_applicable)
    let totalWeight = 0;
    let weightedSum = 0;

    for (const reqEval of requirementEvaluations) {
      if (reqEval.status === 'not_applicable') continue;
      const requirement = schema.requirements.find(
        (r) => r.id === reqEval.requirementId,
      );
      if (!requirement) continue;
      const weight = IMPORTANCE_WEIGHTS[requirement.importance];
      const score = this.statusScore(reqEval.status);
      totalWeight += weight;
      weightedSum += weight * score;
    }

    const skillScore = totalWeight > 0 ? weightedSum / totalWeight : 100;

    // constraint_score: % of required constraints met
    const requiredConstraints = constraintEvaluations.filter(
      (ce) =>
        schema.constraints.find((c) => c.id === ce.constraintId)?.required,
    );
    const constraintScore =
      requiredConstraints.length > 0
        ? (requiredConstraints.filter((c) => c.met).length /
            requiredConstraints.length) *
          100
        : 100;

    // experience bonus: compare relevant experience to JD requirements
    const experienceBonus = this.calculateExperienceBonus(
      candidateSummary,
      schema,
    );

    // project bonus: use AI-assessed project relevance score
    const projectBonus = this.calculateProjectBonus(candidateSummary);

    // final: 0.70 * skill + 0.10 * constraint + 0.10 * experience + 0.10 * project
    const finalScore = Math.round(
      0.7 * skillScore +
        0.1 * constraintScore +
        0.1 * experienceBonus +
        0.1 * projectBonus,
    );

    return {
      skillScore: Math.round(skillScore),
      constraintScore: Math.round(constraintScore),
      experienceBonus: Math.round(experienceBonus),
      projectBonus: Math.round(projectBonus),
      finalScore,
    };
  }

  /**
   * Calculate experience bonus (0-100) by comparing candidate's relevant
   * experience months against the maximum minimumMonths requirement in the JD.
   *
   * - No requirement in JD → 50 (neutral)
   * - ratio >= 1.0 → 100 (meets or exceeds)
   * - ratio 0.75-0.99 → 70-99 (close)
   * - ratio 0.5-0.74 → 40-69 (somewhat lacking)
   * - ratio < 0.5 → 0-39 (significantly lacking)
   */
  private calculateExperienceBonus(
    candidateSummary: CandidateSummary,
    schema: RequirementsSchemaV2,
  ): number {
    // Find the maximum minimumMonths requirement from JD
    const monthsRequirements = schema.requirements
      .filter((r) => r.minimumMonths != null && r.minimumMonths > 0)
      .map((r) => r.minimumMonths as number);

    const requiredMonths =
      monthsRequirements.length > 0 ? Math.max(...monthsRequirements) : 0;

    // If JD doesn't specify experience requirement → neutral score (50)
    if (requiredMonths === 0) return 50;

    const relevant = candidateSummary.relevantExperienceMonths;
    const ratio = relevant / requiredMonths;

    if (ratio >= 1.0) return 100;
    if (ratio >= 0.75) return 70 + Math.round(((ratio - 0.75) / 0.25) * 30);
    if (ratio >= 0.5) return 40 + Math.round(((ratio - 0.5) / 0.25) * 30);
    return Math.round((ratio / 0.5) * 40);
  }

  /**
   * Calculate project bonus (0-100) using AI-assessed project relevance score.
   *
   * - No projects in CV → 30 (default — don't penalize too heavily,
   *   especially seniors who may not list projects)
   * - AI relevanceScore is directly used, with a floor of 30
   */
  private calculateProjectBonus(candidateSummary: CandidateSummary): number {
    const { projectRelevance } = candidateSummary;

    // No projects at all → default 30
    if (projectRelevance.totalProjects === 0) return 30;

    // AI returns relevanceScore 0-100, apply a floor of 30
    return Math.max(30, projectRelevance.relevanceScore);
  }

  private statusScore(status: RequirementEvaluation['status']): number {
    switch (status) {
      case 'met':
        return 100;
      case 'partial':
        return 55;
      default:
        return 0;
    }
  }

  private buildSnapshot(
    requirementEvaluations: RequirementEvaluation[],
    constraintEvaluations: ConstraintEvaluation[],
    warnings: string[],
    candidateSummary: MatchingSnapshotV2['candidateSummary'],
    schema: RequirementsSchemaV2,
    skillScore: number,
    constraintScore: number,
    experienceBonus: number,
    projectBonus: number,
    finalScore: number,
  ): MatchingSnapshotV2 {
    // Enrich evaluations with labels from the schema
    const enrichedRequirements = requirementEvaluations.map((e) => {
      const req = schema.requirements.find((r) => r.id === e.requirementId);
      return {
        ...e,
        label: req?.label ?? e.requirementId,
        importance: req?.importance ?? ('medium' as const),
        category: req?.category ?? ('general' as const),
      };
    });

    const enrichedConstraints = constraintEvaluations.map((ce) => {
      const con = schema.constraints.find((c) => c.id === ce.constraintId);
      return {
        ...ce,
        label: con?.label ?? ce.constraintId,
      };
    });

    const strengths = enrichedRequirements
      .filter((e) => e.status === 'met')
      .slice(0, 4)
      .map((e) => e.label);

    const gaps = enrichedRequirements
      .filter((e) => e.status === 'missing')
      .slice(0, 4)
      .map((e) => e.label);

    const constraintsFailed = enrichedConstraints
      .filter((ce) => !ce.met)
      .map((ce) => ce.label);

    return {
      version: MATCHING_SNAPSHOT_V2,
      scoreBreakdown: {
        skillScore,
        constraintScore,
        experienceBonus,
        projectBonus,
        final: finalScore,
      },
      requirements: enrichedRequirements,
      constraints: enrichedConstraints,
      candidateSummary,
      strengths,
      gaps,
      constraintsFailed,
      warnings: Array.from(new Set([...warnings, ...schema.warnings])).slice(
        0,
        6,
      ),
    };
  }
}
