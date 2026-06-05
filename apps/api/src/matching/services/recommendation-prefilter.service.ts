import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SkillStorageAdapterService } from './skill-storage-adapter.service';

export type PrefilterJobRecord = {
  id: string;
  title: string;
  description: string;
  skills: Prisma.JsonValue;
  skillAtoms: Prisma.JsonValue;
  requirementsSchema: Prisma.JsonValue | null;
  location: Prisma.JsonValue | null;
  recruiterId: string;
};

@Injectable()
export class RecommendationPrefilterService {
  constructor(
    private readonly skillStorageAdapter: SkillStorageAdapterService,
  ) {}

  rankJobs(input: {
    cvCanonicals: Set<string>;
    cvRawText: string | null;
    jobs: PrefilterJobRecord[];
    limit: number;
  }): PrefilterJobRecord[] {
    const useTextFallback = input.cvCanonicals.size < 5;

    const scored = input.jobs.map((job) => {
      const jobAtoms = this.skillStorageAdapter.readSkillAtoms(job.skillAtoms);
      const jobCanonicals = new Set(jobAtoms.map((a) => a.canonical));

      // Signal 1: Canonical Skill Overlap (Jaccard)
      const canonicalScore = this.jaccardSimilarity(
        input.cvCanonicals,
        jobCanonicals,
      );

      // Signal 2: Text keyword fallback (only when CV has few skills)
      const textScore =
        useTextFallback && input.cvRawText
          ? this.textKeywordMatch(input.cvRawText, job.skills, job.description)
          : null;

      // Combined score: heavily favor Jaccard canonical score, text fallback is extremely weak (0.1)
      const combined =
        textScore !== null
          ? canonicalScore * 0.9 + textScore * 0.1
          : canonicalScore;

      return { job, score: combined };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map((item) => item.job);
  }

  /**
   * Jaccard Similarity: |A ∩ B| / |A ∪ B|
   */
  jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setB) {
      if (setA.has(item)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Simple keyword frequency match as fallback for CVs with few parsed skills.
   * Compares CV raw text against job skills and technical keywords from description.
   */
  textKeywordMatch(
    cvRawText: string,
    jobSkills: Prisma.JsonValue,
    jobDescription: string,
  ): number {
    const cvLower = cvRawText.toLowerCase();
    const skills = Array.isArray(jobSkills)
      ? jobSkills.filter((s): s is string => typeof s === 'string')
      : [];

    // Extract likely technical keywords from description
    // (Only extremely specific technical terms like C++, .NET, C#)
    const descKeywords = jobDescription
      .split(/[\s,;]+/)
      .filter((w) => w.length >= 2)
      .filter((w) => /[.#+]/.test(w))
      .map((w) => w.toLowerCase().replace(/[,.:;()]/g, ''));

    const allKeywords = [
      ...new Set([...skills.map((s) => s.toLowerCase()), ...descKeywords]),
    ];
    if (allKeywords.length === 0) return 0;

    const hits = allKeywords.filter((kw) => cvLower.includes(kw)).length;
    return hits / allKeywords.length;
  }
}
