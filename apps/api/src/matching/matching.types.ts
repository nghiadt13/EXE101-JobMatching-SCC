import { UserRole } from '@prisma/client';
import {
  MatchingSnapshot,
  MatchingVersion,
} from './types/skill-canonical.types';

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
  matchingVersion: MatchingVersion;
  warnings: string[];
};

export type MatchingIntegrationPayload = {
  finalScorePercent: number;
  tfidfScore: number;
  skillsScore: number;
  breakdown: MatchingBreakdown;
  matchingVersion: MatchingVersion;
  warnings: string[];
  matchingSnapshot: MatchingSnapshot;
};
