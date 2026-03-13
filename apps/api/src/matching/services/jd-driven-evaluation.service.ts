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

    const { skillScore, constraintScore, finalScore } =
      this.scoreDeterministically(
        evaluation.requirementEvaluations,
        evaluation.constraintEvaluations,
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
      finalScore,
    );

    this.logger.info('jd_driven_evaluation_scored', {
      finalScore,
      skillScore,
      constraintScore,
      requirementsCount: requirementsSchema.requirements.length,
      constraintsCount: requirementsSchema.constraints.length,
    });

    return { finalScorePercent: finalScore, snapshot };
  }

  private scoreDeterministically(
    requirementEvaluations: RequirementEvaluation[],
    constraintEvaluations: ConstraintEvaluation[],
    schema: RequirementsSchemaV2,
  ): { skillScore: number; constraintScore: number; finalScore: number } {
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

    // final: 0.85 * skill + 0.15 * constraint (matching policy)
    const finalScore = Math.round(0.85 * skillScore + 0.15 * constraintScore);

    return {
      skillScore: Math.round(skillScore),
      constraintScore: Math.round(constraintScore),
      finalScore,
    };
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
    finalScore: number,
  ): MatchingSnapshotV2 {
    const strengths = requirementEvaluations
      .filter((e) => e.status === 'met')
      .slice(0, 4)
      .map(
        (e) =>
          schema.requirements.find((r) => r.id === e.requirementId)?.label ??
          e.requirementId,
      );

    const gaps = requirementEvaluations
      .filter((e) => e.status === 'missing')
      .slice(0, 4)
      .map(
        (e) =>
          schema.requirements.find((r) => r.id === e.requirementId)?.label ??
          e.requirementId,
      );

    const constraintsFailed = constraintEvaluations
      .filter((ce) => !ce.met)
      .map(
        (ce) =>
          schema.constraints.find((c) => c.id === ce.constraintId)?.label ??
          ce.constraintId,
      );

    return {
      version: MATCHING_SNAPSHOT_V2,
      scoreBreakdown: { skillScore, constraintScore, final: finalScore },
      requirements: requirementEvaluations,
      constraints: constraintEvaluations,
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
