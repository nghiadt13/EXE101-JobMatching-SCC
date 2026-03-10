import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import type { NormalizedProfile } from '../normalization/normalization.types';
import { PrismaService } from '../prisma/prisma.service';
import { JOB_LOCATION_NORMALIZATION_KEY } from '../normalization/normalization.types';
import { ERROR_CODES } from '../common/errors/error-codes';
import {
  MatchingActor,
  MatchingIntegrationPayload,
  MatchingResult,
} from './matching.types';
import { CandidateProfileService } from './services/candidate-profile.service';
import { JobRequirementsSchemaService } from './services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from './services/schema-matching-evaluator.service';
import { JdDrivenEvaluationService } from './services/jd-driven-evaluation.service';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { CV_MAX_TEXT_CHARS } from '../cvs/cvs.constants';
import {
  CandidateProfileV1,
  RequirementsSchemaV1,
  RequirementsSchemaV2,
  REQUIREMENTS_SCHEMA_V2,
} from './types/schema-matching.types';

type CvRecord = {
  id: string;
  candidateId: string;
  skills: Prisma.JsonValue;
  candidateProfile: Prisma.JsonValue | null;
  parsedData: Prisma.JsonValue;
  rawText: string | null;
  filePath: string;
  candidate: { userId: string };
};

type JobRecord = {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  skills: Prisma.JsonValue;
  requirementsSchema: Prisma.JsonValue | null;
  location: Prisma.JsonValue | null;
  status: JobStatus;
};

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRequirementsSchemaService: JobRequirementsSchemaService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly schemaMatchingEvaluator: SchemaMatchingEvaluatorService,
    private readonly jdDrivenEvaluationService: JdDrivenEvaluationService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentTextExtractorService: DocumentTextExtractorService,
  ) {}

  async calculateForCvAndJob(
    cvId: string,
    jobId: string,
    actor: MatchingActor,
  ): Promise<MatchingResult> {
    const cv = await this.getCvOrThrow(cvId, actor);
    const job = await this.getJobOrThrow(jobId, actor);
    const requirementsSchema = this.resolveRequirementsSchema(job);

    const isV2 = 'version' in requirementsSchema && requirementsSchema.version === REQUIREMENTS_SCHEMA_V2;

    if (isV2) {
      const cvRawText = await this.getCvRawText(cv);
      const evaluation = await this.jdDrivenEvaluationService.evaluate({
        cvRawText,
        requirementsSchema: requirementsSchema as RequirementsSchemaV2,
      });

      const warnings = Array.from(
        new Set([
          ...evaluation.snapshot.warnings,
          ...this.buildWarnings(cv.parsedData, job.location),
        ]),
      );

      return {
        score: evaluation.finalScorePercent,
        matchingVersion: 'schema_v2',
        warnings,
        matchingSnapshot: {
          ...evaluation.snapshot,
          warnings,
        },
      };
    }

    // --- V1 Legacy Pipeline ---
    const candidateProfile = this.resolveCandidateProfile(cv);
    const evaluation = this.schemaMatchingEvaluator.evaluate(
      requirementsSchema as RequirementsSchemaV1,
      candidateProfile,
    );
    const warnings = Array.from(
      new Set([
        ...evaluation.snapshot.warnings,
        ...this.buildWarnings(cv.parsedData, job.location),
      ]),
    );

    return {
      score: evaluation.finalScorePercent,
      matchingVersion: 'schema_v1',
      warnings,
      matchingSnapshot: {
        ...evaluation.snapshot,
        warnings,
      },
    };
  }

  private async getCvRawText(cv: CvRecord): Promise<string> {
    if (cv.rawText) {
      return cv.rawText;
    }
    try {
      // Fallback: Extract from file on the fly (legacy CVs prior to rawText storage)
      const absolutePath = this.documentStorageService.getAbsolutePath(
        'cvs',
        cv.filePath,
      );
      const buffer = await readFile(absolutePath);
      const extension = extname(cv.filePath).toLowerCase();
      const mimetype =
        extension === '.pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const file = {
        buffer,
        mimetype,
        originalname: cv.filePath,
      } as Express.Multer.File;
      const extracted = await this.documentTextExtractorService.extract(
        file,
        'CV fallback',
      );
      return extracted.slice(0, CV_MAX_TEXT_CHARS);
    } catch {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.cvParseFailed,
        message:
          'Could not read CV file for matching. Please re-upload your CV and try again.',
        details: { stage: 'matching_fallback_extraction' },
      });
    }
  }


  async calculateIntegrationPayload(
    cvId: string,
    jobId: string,
    actor: MatchingActor,
  ): Promise<MatchingIntegrationPayload> {
    const result = await this.calculateForCvAndJob(cvId, jobId, actor);
    return {
      finalScorePercent: result.score,
      matchingVersion: result.matchingVersion,
      warnings: result.warnings,
      matchingSnapshot: result.matchingSnapshot,
    };
  }

  private async getCvOrThrow(
    cvId: string,
    actor: MatchingActor,
  ): Promise<CvRecord> {
    const cv = (await this.prisma.cV.findFirst({
      where: { id: cvId, deletedAt: null },
      select: {
        id: true,
        candidateId: true,
        skills: true,
        candidateProfile: true,
        parsedData: true,
        rawText: true,
        filePath: true,
        candidate: { select: { userId: true } },
      },
    })) as CvRecord | null;
    const candidateUserId = cv?.candidate.userId ?? null;
    if (!cv || !candidateUserId || !this.canViewCv(actor, candidateUserId)) {
      throw new NotFoundException('Resource not found');
    }
    return cv;
  }

  private async getJobOrThrow(
    jobId: string,
    actor: MatchingActor,
  ): Promise<JobRecord> {
    const job = (await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
      select: {
        id: true,
        recruiterId: true,
        title: true,
        description: true,
        skills: true,
        requirementsSchema: true,
        location: true,
        status: true,
      },
    })) as JobRecord | null;
    if (!job || !this.canViewJob(actor, job)) {
      throw new NotFoundException('Resource not found');
    }
    return job;
  }

  private canViewCv(actor: MatchingActor, cvOwnerUserId: string): boolean {
    if (actor.role === UserRole.CANDIDATE) {
      return actor.sub === cvOwnerUserId;
    }
    return true;
  }

  private canViewJob(actor: MatchingActor, job: JobRecord): boolean {
    if (actor.role === UserRole.ADMIN) {
      return true;
    }
    if (actor.role === UserRole.RECRUITER) {
      return job.status === JobStatus.PUBLISHED || job.recruiterId === actor.sub;
    }
    return job.status === JobStatus.PUBLISHED;
  }

  private resolveCandidateProfile(cv: CvRecord): CandidateProfileV1 {
    const stored = this.readJsonObject(cv.candidateProfile);
    if (Object.keys(stored).length > 0) {
      return stored as unknown as CandidateProfileV1;
    }

    const parsedData = this.readJsonObject(cv.parsedData);
    const normalizedProfile = this.readJsonObject(
      parsedData.normalizedProfile,
    );
    return this.candidateProfileService.create({
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
      parsedData: parsedData as Record<string, unknown>,
      skills: this.readJsonStringArray(cv.skills),
    });
  }

  private resolveRequirementsSchema(job: JobRecord): RequirementsSchemaV1 | RequirementsSchemaV2 {
    const stored = this.readJsonObject(job.requirementsSchema);
    if (Object.keys(stored).length > 0) {
      if (stored['version'] === REQUIREMENTS_SCHEMA_V2) {
        return stored as unknown as RequirementsSchemaV2;
      }
      return stored as unknown as RequirementsSchemaV1;
    }

    const normalizedProfile = this.readJsonObject(
      this.extractNormalizedProfileFromLocation(job.location),
    );

    // If no stored schema, create V2 by default for new analyses
    return this.jobRequirementsSchemaService.createV2({
      title: job.title,
      summary: this.readJsonString(normalizedProfile.summary),
      skills: this.readJsonStringArray(job.skills),
      description: job.description,
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
      location: this.readLocationObject(job.location),
    });
  }

  private buildWarnings(
    parsedData: Prisma.JsonValue,
    location: Prisma.JsonValue | null,
  ): string[] {
    const warnings: string[] = [];
    if (this.needsManualReview(this.readJsonObject(parsedData).normalizedProfile)) {
      warnings.push('CV parsing needs manual review');
    }
    if (this.needsManualReview(this.extractNormalizedProfileFromLocation(location))) {
      warnings.push('Job parsing needs manual review');
    }
    return warnings;
  }

  private needsManualReview(
    profile: Prisma.JsonValue | null | undefined,
  ): boolean {
    const rawQuality = this.readJsonObject(
      this.readJsonObject(profile ?? null).rawQuality,
    );
    return rawQuality.needsManualReview === true;
  }

  private extractNormalizedProfileFromLocation(
    location: Prisma.JsonValue | null,
  ): Prisma.JsonValue | null {
    const root = this.readJsonObject(location);
    const normalization = this.readJsonObject(root[JOB_LOCATION_NORMALIZATION_KEY]);
    return normalization.normalizedProfile ?? null;
  }

  private readLocationObject(
    value: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    const root = this.readJsonObject(value) as Record<string, unknown>;
    if (!Object.keys(root).length) {
      return null;
    }
    const clean = { ...root } as Record<string, unknown>;
    delete clean[JOB_LOCATION_NORMALIZATION_KEY];
    return Object.keys(clean).length ? clean : null;
  }

  private readJsonStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private readJsonObject(
    value: Prisma.JsonValue | null | undefined,
  ): Record<string, Prisma.JsonValue> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, Prisma.JsonValue>)
      : {};
  }

  private readJsonString(value: Prisma.JsonValue | undefined): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.filter((entry) => typeof entry === 'string').join(' ').trim();
    }
    if (value && typeof value === 'object') {
      return Object.values(value)
        .filter((entry) => typeof entry === 'string')
        .join(' ')
        .trim();
    }
    return '';
  }
}
