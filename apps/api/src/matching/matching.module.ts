import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { CandidateProfileService } from './services/candidate-profile.service';
import { JobRequirementsSchemaService } from './services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from './services/schema-matching-evaluator.service';
import { SkillAtomizerService } from './services/skill-atomizer.service';
import { SkillCanonicalizerService } from './services/skill-canonicalizer.service';
import { SkillStorageAdapterService } from './services/skill-storage-adapter.service';
import { JdDrivenEvaluationService } from './services/jd-driven-evaluation.service';
import { RecommendationService } from './services/recommendation.service';
import { RecommendationPrefilterService } from './services/recommendation-prefilter.service';
import { RecommendationController } from './recommendation.controller';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { DeepseekClientService } from '../normalization/deepseek-client.service';
import { GeminiClientService } from '../normalization/gemini-client.service';
import { KimiClientService } from '../normalization/kimi-client.service';

@Module({
  controllers: [MatchingController, RecommendationController],
  providers: [
    MatchingService,
    SkillCanonicalizerService,
    SkillAtomizerService,
    SkillStorageAdapterService,
    JobRequirementsSchemaService,
    CandidateProfileService,
    SchemaMatchingEvaluatorService,
    JdDrivenEvaluationService,
    DocumentStorageService,
    DocumentTextExtractorService,
    AiNormalizationService,
    GeminiClientService,
    KimiClientService,
    DeepseekClientService,
    RecommendationService,
    RecommendationPrefilterService,
  ],
  exports: [
    MatchingService,
    SkillStorageAdapterService,
    JobRequirementsSchemaService,
    CandidateProfileService,
    SchemaMatchingEvaluatorService,
    JdDrivenEvaluationService,
    RecommendationService,
  ],
})
export class MatchingModule {}
