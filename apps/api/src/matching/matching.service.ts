import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import {
  MatchingActor,
  MatchingIntegrationPayload,
  MatchingResult,
} from './matching.types';

type CvRecord = {
  id: string;
  candidateId: string;
  skills: Prisma.JsonValue;
  parsedData: Prisma.JsonValue;
  candidate: { userId: string };
};

type JobRecord = {
  id: string;
  recruiterId: string;
  description: string;
  skills: Prisma.JsonValue;
  status: JobStatus;
};

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tfidfCalculator: TfidfCalculatorService,
    private readonly skillsCalculator: SkillsCalculatorService,
    private readonly scoreCombiner: ScoreCombinerService,
  ) {}

  async calculateForCvAndJob(
    cvId: string,
    jobId: string,
    actor: MatchingActor,
  ): Promise<MatchingResult> {
    const cv = await this.getCvOrThrow(cvId, actor);
    const job = await this.getJobOrThrow(jobId, actor);
    const cvSkills = this.readJsonStringArray(cv.skills);
    const jobSkills = this.readJsonStringArray(job.skills);
    const cvText = this.extractCvText(cv.parsedData, cvSkills);
    const jobText = this.extractJobText(job.description, jobSkills);

    const tfidfScore = this.scoreCombiner.normalizeUnit(
      this.tfidfCalculator.calculateTfidfScore(cvText, jobText),
    );
    const skillsScore = this.scoreCombiner.normalizeUnit(
      this.skillsCalculator.calculateSkillsScore(cvSkills, jobSkills),
    );
    const breakdown = this.skillsCalculator.calculateBreakdown(
      cvSkills,
      jobSkills,
    );

    return {
      score: this.scoreCombiner.calculateFinalScore(tfidfScore, skillsScore),
      tfidfScore,
      skillsScore,
      breakdown,
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
    };
  }

  private async getCvOrThrow(
    cvId: string,
    actor: MatchingActor,
  ): Promise<CvRecord> {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, deletedAt: null },
      select: {
        id: true,
        candidateId: true,
        skills: true,
        parsedData: true,
        candidate: { select: { userId: true } },
      },
    });
    if (!cv || !this.canViewCv(actor, cv.candidate.userId)) {
      throw new NotFoundException('Resource not found');
    }
    return cv;
  }

  private async getJobOrThrow(
    jobId: string,
    actor: MatchingActor,
  ): Promise<JobRecord> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
      select: {
        id: true,
        recruiterId: true,
        description: true,
        skills: true,
        status: true,
      },
    });
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

  private extractJobText(description: string, skills: string[]): string {
    return `${description} ${skills.join(' ')}`.trim();
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
