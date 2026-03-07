import type { JobItem } from './jobs-client';

type JobDescriptionSections = {
  summary: string;
  requirements: string[];
  benefits: string[];
};

type JobFormInitialValues = {
  title?: string;
  summary?: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  employmentType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
};

const REQUIREMENTS_HEADING = 'Requirements:';
const BENEFITS_HEADING = 'Benefits:';

export function parseMultilineList(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*\u2022\s]+/, '').trim())
    .filter(Boolean);
}

export function formatMultilineList(items?: string[]): string {
  return (items ?? []).join('\n');
}

export function composeJobDescription(sections: JobDescriptionSections): string {
  const blocks = [sections.summary.trim()].filter(Boolean);

  if (sections.requirements.length > 0) {
    blocks.push(
      `${REQUIREMENTS_HEADING}\n- ${sections.requirements.join('\n- ')}`,
    );
  }

  if (sections.benefits.length > 0) {
    blocks.push(`${BENEFITS_HEADING}\n- ${sections.benefits.join('\n- ')}`);
  }

  return blocks.join('\n\n').trim();
}

export function getJobFormInitialValues(job: JobItem): JobFormInitialValues {
  const fallback = extractDescriptionSections(job.description);
  const hasSavedDescription = job.description.trim().length > 0;

  return {
    title: job.title,
    summary: hasSavedDescription
      ? fallback.summary
      : (job.normalizedProfile?.summary?.trim() ?? ''),
    requirements:
      hasSavedDescription
        ? fallback.requirements
        : (job.normalizedProfile?.jobMeta?.requirements ?? []),
    benefits:
      hasSavedDescription
        ? fallback.benefits
        : (job.normalizedProfile?.jobMeta?.benefits ?? []),
    skills: job.skills,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  };
}

function extractDescriptionSections(description: string): JobDescriptionSections {
  const normalized = description.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return { summary: '', requirements: [], benefits: [] };
  }

  const summaryLines: string[] = [];
  const requirements: string[] = [];
  const benefits: string[] = [];
  let currentSection: 'summary' | 'requirements' | 'benefits' = 'summary';

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim();

    if (/^requirements:\s*$/i.test(line)) {
      currentSection = 'requirements';
      continue;
    }

    if (/^benefits:\s*$/i.test(line)) {
      currentSection = 'benefits';
      continue;
    }

    if (!line) {
      if (currentSection === 'summary') {
        summaryLines.push('');
      }
      continue;
    }

    if (currentSection === 'requirements') {
      requirements.push(...parseMultilineList(line));
      continue;
    }

    if (currentSection === 'benefits') {
      benefits.push(...parseMultilineList(line));
      continue;
    }

    summaryLines.push(rawLine.trimEnd());
  }

  return {
    summary: summaryLines.join('\n').trim(),
    requirements,
    benefits,
  };
}