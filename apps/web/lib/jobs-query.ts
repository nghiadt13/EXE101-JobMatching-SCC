import { type JobsQuery, type JobsRemoteFilter, type JobsSort } from './jobs-client';

const JOBS_SORT_SET = new Set<JobsSort>(['newest', 'salary_asc', 'salary_desc']);
const JOBS_REMOTE_SET = new Set<JobsRemoteFilter>(['any', 'true', 'false']);
const JOBS_POSTED_WITHIN_SET = new Set([1, 3, 7, 14, 30] as const);

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.trunc(parsed);
}

export function parseJobsQueryFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): JobsQuery {
  const page = toInt(pickFirst(searchParams.page));
  const limit = toInt(pickFirst(searchParams.limit));
  const q = pickFirst(searchParams.q)?.trim();
  const search = pickFirst(searchParams.search)?.trim();
  const sortRaw = pickFirst(searchParams.sort);
  const remoteRaw = pickFirst(searchParams.remote);
  const employmentRaw = pickFirst(searchParams.employmentTypes);
  const salaryMinGte = toInt(pickFirst(searchParams.salaryMinGte));
  const salaryMaxLte = toInt(pickFirst(searchParams.salaryMaxLte));
  const postedWithinDays = toInt(pickFirst(searchParams.postedWithinDays));

  const sort = sortRaw && JOBS_SORT_SET.has(sortRaw as JobsSort) ? (sortRaw as JobsSort) : 'newest';
  const remote =
    remoteRaw && JOBS_REMOTE_SET.has(remoteRaw as JobsRemoteFilter)
      ? (remoteRaw as JobsRemoteFilter)
      : 'any';
  const employmentTypes = employmentRaw
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);

  return {
    page: page && page > 0 ? page : 1,
    limit: limit && limit > 0 ? Math.min(limit, 60) : 20,
    ...(q ? { q } : {}),
    ...(search ? { search } : {}),
    sort,
    remote,
    ...(employmentTypes && employmentTypes.length > 0 ? { employmentTypes } : {}),
    ...(salaryMinGte !== undefined && salaryMinGte >= 0 ? { salaryMinGte } : {}),
    ...(salaryMaxLte !== undefined && salaryMaxLte >= 0 ? { salaryMaxLte } : {}),
    ...(postedWithinDays !== undefined &&
    JOBS_POSTED_WITHIN_SET.has(postedWithinDays as 1 | 3 | 7 | 14 | 30)
      ? { postedWithinDays: postedWithinDays as 1 | 3 | 7 | 14 | 30 }
      : {}),
  };
}
