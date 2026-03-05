import { Module } from '@nestjs/common';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  controllers: [MatchingController],
  providers: [
    MatchingService,
    TfidfCalculatorService,
    SkillsCalculatorService,
    ScoreCombinerService,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
