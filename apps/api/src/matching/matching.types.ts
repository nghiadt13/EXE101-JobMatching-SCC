import { UserRole } from '@prisma/client';
import {
  SchemaMatchingSnapshot,
  MatchingSnapshotV2,
} from './types/schema-matching.types';

export type MatchingActor = {
  sub: string;
  role: UserRole;
};

export type MatchingResult = {
  score: number;
  matchingVersion: 'schema_v1' | 'schema_v2';
  warnings: string[];
  matchingSnapshot: SchemaMatchingSnapshot | MatchingSnapshotV2;
};

export type MatchingIntegrationPayload = {
  finalScorePercent: number;
  matchingVersion: 'schema_v1' | 'schema_v2';
  warnings: string[];
  matchingSnapshot: SchemaMatchingSnapshot | MatchingSnapshotV2;
};
