import { UserRole } from '@prisma/client';

export type MatchingActor = {
  sub: string;
  role: UserRole;
};

export type MatchingBreakdown = {
  matchedSkills: string[];
  missingSkills: string[];
};

export type MatchingResult = {
  score: number;
  tfidfScore: number;
  skillsScore: number;
  breakdown: MatchingBreakdown;
};

export type MatchingIntegrationPayload = {
  finalScorePercent: number;
  tfidfScore: number;
  skillsScore: number;
  breakdown: MatchingBreakdown;
};
