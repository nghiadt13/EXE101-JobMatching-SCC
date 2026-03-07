import { UserRole } from '@prisma/client';
import { SchemaMatchingSnapshot } from './types/schema-matching.types';

export type MatchingActor = {
  sub: string;
  role: UserRole;
};

export type MatchingResult = {
  score: number;
  matchingVersion: 'schema_v1';
  warnings: string[];
  matchingSnapshot: SchemaMatchingSnapshot;
};

export type MatchingIntegrationPayload = {
  finalScorePercent: number;
  matchingVersion: 'schema_v1';
  warnings: string[];
  matchingSnapshot: SchemaMatchingSnapshot;
};
