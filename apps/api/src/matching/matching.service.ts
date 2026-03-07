import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JOB_LOCATION_NORMALIZATION_KEY } from '../normalization/normalization.types';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import { SkillStorageAdapterService } from './services/skill-storage-adapter.service';
import {
  MatchingActor,
  MatchingIntegrationPayload,
  MatchingResult,
} from './matching.types';
import { MatchingVersion, SkillAtom } from './types/skill-canonical.types';

type CvRecord = {
  id: string;
  candidateId: string;
  skills: Prisma.JsonValue;
  skillAtoms: Prisma.JsonValue | null;
  parsedData: Prisma.JsonValue;
  candidate: { userId: string };
};

type JobRecord = {
  id: string;
  recruiterId: string;
  description: string;
  skills: Prisma.JsonValue;
  skillAtoms: Prisma.JsonValue | null;
  location: Prisma.JsonValue | null;
  status: JobStatus;
};

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tfidfCalculator: TfidfCalculatorService,
    private readonly skillsCalculator: SkillsCalculatorService,
    private readonly scoreCombiner: ScoreCombinerService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
  ) {}

  async calculateForCvAndJob(
    cvId: string,
    jobId: string,
    actor: MatchingActor,
  ): Promise<MatchingResult> {
    const cv = await this.getCvOrThrow(cvId, actor);
    const job = await this.getJobOrThrow(jobId, actor);
    const matchingVersion = this.readConfiguredMatchingVersion();
    const legacyInputs =
      matchingVersion === 'legacy'
        ? this.buildLegacySkillInputs(cv, job)
        : null;
    const v2Inputs =
      matchingVersion === 'v2' ? this.buildV2SkillInputs(cv, job) : null;
    const inputs = legacyInputs ?? v2Inputs;
    if (!inputs) {
      throw new NotFoundException('Resource not found');
    }
    const canonicalWarnings = {
      missingCvAtoms: v2Inputs?.missingCvAtoms ?? false,
      missingJobAtoms: v2Inputs?.missingJobAtoms ?? false,
    };
    const cvSkills = this.toSkillLabels(inputs.cvSkills);
    const jobSkills = this.toSkillLabels(inputs.jobSkills);
    const cvText = this.extractCvText(cv.parsedData, cvSkills);
    const jobText = this.extractJobText(
      job.description,
      jobSkills,
      job.location,
    );

    const tfidfScore = this.scoreCombiner.normalizeUnit(
      this.tfidfCalculator.calculateTfidfScore(cvText, jobText),
    );
    const skillsScore = this.scoreCombiner.normalizeUnit(
      this.skillsCalculator.calculateSkillsScore(
        inputs.cvSkills,
        inputs.jobSkills,
      ),
    );
    const breakdown = this.skillsCalculator.calculateBreakdown(
      inputs.cvSkills,
      inputs.jobSkills,
    );
    const warnings = this.buildWarnings(
      cv.parsedData,
      job.location,
      canonicalWarnings.missingCvAtoms,
      canonicalWarnings.missingJobAtoms,
    );

    return {
      score: this.scoreCombiner.calculateFinalScore(tfidfScore, skillsScore),
      tfidfScore,
      skillsScore,
      breakdown,
      matchingVersion,
      warnings,
    };
  }

  async calculateIntegrationPayload(
    cvId: string,
    jobId: string,
    actor: MatchingActor,
  ): Promise<MatchingIntegrationPayload> {
    const result = await this.calculateForCvAndJob(cvId, jobId, actor);
    return {
      finalScorePercent: result.score,
      tfidfScore: result.tfidfScore,
      skillsScore: result.skillsScore,
      breakdown: result.breakdown,
      matchingVersion: result.matchingVersion,
      warnings: result.warnings,
      matchingSnapshot: {
        version: result.matchingVersion,
        componentScores: {
          tfidf: result.tfidfScore,
          skills: result.skillsScore,
          final: result.score,
        },
        topMatchedSkills: result.breakdown.matchedSkills.slice(0, 8),
        missingSkills: result.breakdown.missingSkills,
        warnings: result.warnings,
      },
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
        skillAtoms: true,
        parsedData: true,
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
        description: true,
        skills: true,
        skillAtoms: true,
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
      return (
        job.status === JobStatus.PUBLISHED || job.recruiterId === actor.sub
      );
    }
    return job.status === JobStatus.PUBLISHED;
  }

  private extractCvText(
    parsedData: Prisma.JsonValue,
    skills: string[],
  ): string {
    const root = this.readJsonObject(parsedData);
    const chunks = [
      this.readJsonString(root.summary),
      this.readJsonString(root.contact),
      this.readJsonString(root.experience),
      this.readJsonString(root.education),
      skills.join(' '),
    ];
    return chunks.filter(Boolean).join(' ');
  }

  private extractJobText(
    description: string,
    skills: string[],
    location: Prisma.JsonValue | null,
  ): string {
    const normalized = this.extractNormalizedProfileFromLocation(location);
    if (normalized) {
      const root = this.readJsonObject(normalized);
      const chunks = [
        this.readJsonString(root.summary),
        this.readJsonString(root.title),
        this.readJsonString(root.jobMeta),
        skills.join(' '),
      ];
      return chunks.filter(Boolean).join(' ');
    }
    return `${description} ${skills.join(' ')}`.trim();
  }

  private extractCvNormalizedProfile(parsedData: Prisma.JsonValue): string[] {
    const root = this.readJsonObject(parsedData);
    const normalized = this.readJsonObject(root.normalizedProfile);
    return this.readJsonStringArray(normalized.skills);
  }

  private extractCvSkillAtoms(cv: CvRecord): SkillAtom[] {
    return this.skillStorageAdapter.readSkillAtoms(cv.skillAtoms);
  }

  private extractJobNormalizedProfile(
    location: Prisma.JsonValue | null,
  ): string[] {
    const normalized = this.extractNormalizedProfileFromLocation(location);
    if (!normalized) {
      return [];
    }
    return this.readJsonStringArray(this.readJsonObject(normalized).skills);
  }

  private extractJobSkillAtoms(job: JobRecord): SkillAtom[] {
    return this.skillStorageAdapter.readSkillAtoms(job.skillAtoms);
  }

  private buildLegacySkillInputs(cv: CvRecord, job: JobRecord) {
    const cvSkills = this.extractCvNormalizedProfile(cv.parsedData);
    const jobSkills = this.extractJobNormalizedProfile(job.location);

    return {
      cvSkills:
        cvSkills.length > 0 ? cvSkills : this.readJsonStringArray(cv.skills),
      jobSkills:
        jobSkills.length > 0 ? jobSkills : this.readJsonStringArray(job.skills),
      usedLegacyFallback: false,
    };
  }

  private buildV2SkillInputs(cv: CvRecord, job: JobRecord) {
    const cvSkills = this.extractCvSkillAtoms(cv);
    const jobSkills = this.extractJobSkillAtoms(job);

    return {
      cvSkills,
      jobSkills,
      missingCvAtoms: cvSkills.length === 0,
      missingJobAtoms: jobSkills.length === 0,
    };
  }

  private buildWarnings(
    parsedData: Prisma.JsonValue,
    location: Prisma.JsonValue | null,
    missingCvAtoms: boolean,
    missingJobAtoms: boolean,
  ): string[] {
    const warnings: string[] = [];
    if (missingCvAtoms) {
      warnings.push(
        'CV canonical skills are missing. Reprocess the CV before relying on this match.',
      );
    }
    if (missingJobAtoms) {
      warnings.push(
        'Job canonical skills are missing. Reprocess the JD before relying on this match.',
      );
    }
    if (
      this.needsManualReview(this.readJsonObject(parsedData).normalizedProfile)
    ) {
      warnings.push('CV parsing needs manual review');
    }
    if (
      this.needsManualReview(
        this.extractNormalizedProfileFromLocation(location),
      )
    ) {
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

  private readConfiguredMatchingVersion(): MatchingVersion {
    return process.env['MATCHING_VERSION'] === 'legacy' ? 'legacy' : 'v2';
  }

  private toSkillLabels(skills: Array<string | SkillAtom>): string[] {
    return skills.map((entry) =>
      typeof entry === 'string' ? entry.trim() : entry.label,
    );
  }

  private extractNormalizedProfileFromLocation(
    location: Prisma.JsonValue | null,
  ): Prisma.JsonValue | null {
    const root = this.readJsonObject(location);
    const normalization = this.readJsonObject(
      root[JOB_LOCATION_NORMALIZATION_KEY],
    );
    return normalization.normalizedProfile ?? null;
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
    value: Prisma.JsonValue,
  ): Record<string, Prisma.JsonValue> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, Prisma.JsonValue>)
      : {};
  }

  private readJsonString(value: Prisma.JsonValue | undefined): string {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.filter((entry) => typeof entry === 'string').join(' ');
    }
    if (value && typeof value === 'object') {
      return Object.values(value)
        .filter((entry) => typeof entry === 'string')
        .join(' ');
    }
    return '';
  }
}
