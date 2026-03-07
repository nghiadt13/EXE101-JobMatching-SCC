import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { CandidateProfileService } from './services/candidate-profile.service';
import { JobRequirementsSchemaService } from './services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from './services/schema-matching-evaluator.service';
import { SkillAtomizerService } from './services/skill-atomizer.service';
import { SkillCanonicalizerService } from './services/skill-canonicalizer.service';
import { SkillStorageAdapterService } from './services/skill-storage-adapter.service';

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
  ],
  exports: [
    MatchingService,
    SkillStorageAdapterService,
    JobRequirementsSchemaService,
    CandidateProfileService,
    SchemaMatchingEvaluatorService,
  ],
})
export class MatchingModule {}
