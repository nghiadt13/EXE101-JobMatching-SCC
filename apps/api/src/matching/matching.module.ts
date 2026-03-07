import { Module } from '@nestjs/common';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { SkillAtomizerService } from './services/skill-atomizer.service';
import { SkillCanonicalizerService } from './services/skill-canonicalizer.service';
import { SkillStorageAdapterService } from './services/skill-storage-adapter.service';

@Module({
  controllers: [MatchingController],
  providers: [
    MatchingService,
    TfidfCalculatorService,
    SkillsCalculatorService,
    ScoreCombinerService,
    SkillCanonicalizerService,
    SkillAtomizerService,
    SkillStorageAdapterService,
  ],
  exports: [MatchingService, SkillStorageAdapterService],
})
export class MatchingModule {}
