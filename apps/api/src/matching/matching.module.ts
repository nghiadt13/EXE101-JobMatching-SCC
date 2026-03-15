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
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { GeminiClientService } from '../normalization/gemini-client.service';
import { KimiClientService } from '../normalization/kimi-client.service';

@Module({
  controllers: [MatchingController],
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
  ],
  exports: [
    MatchingService,
    SkillStorageAdapterService,
    JobRequirementsSchemaService,
    CandidateProfileService,
    SchemaMatchingEvaluatorService,
    JdDrivenEvaluationService,
  ],
})
export class MatchingModule {}
