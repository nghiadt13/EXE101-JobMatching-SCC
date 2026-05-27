import { type JobsQuery, type JobsRemoteFilter, type JobsSort } from './jobs-client';

const JOBS_SORT_SET = new Set<JobsSort>(['newest', 'salary_asc', 'salary_desc', 'deadline_soon', 'relevance']);
const JOBS_REMOTE_SET = new Set<JobsRemoteFilter>(['any', 'true', 'false']);
const JOBS_POSTED_WITHIN_SET = new Set([1, 3, 7, 14, 30] as const);

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.trunc(parsed);
}

function parseCsvParam(value: string | string[] | undefined): string[] | undefined {
  const raw = pickFirst(value);
  if (!raw) return undefined;
  const list = raw.split(',').map(v => v.trim()).filter(Boolean);
  return list.length > 0 ? list : undefined;
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
  const remote = remoteRaw && JOBS_REMOTE_SET.has(remoteRaw as JobsRemoteFilter) ? (remoteRaw as JobsRemoteFilter) : 'any';
  const employmentTypes = employmentRaw?.split(',').map(v => v.trim()).filter(Boolean).slice(0, 10);

  const categorySlugs = parseCsvParam(searchParams.categorySlugs);
  const experienceLevels = parseCsvParam(searchParams.experienceLevels);
  const companyIndustryKeys = parseCsvParam(searchParams.companyIndustryKeys);
  const jobFieldKeys = parseCsvParam(searchParams.jobFieldKeys);
  const companyTypes = parseCsvParam(searchParams.companyTypes);
  const salaryBands = parseCsvParam(searchParams.salaryBands);
  const jobLevels = parseCsvParam(searchParams.jobLevels);
  const salesModels = parseCsvParam(searchParams.salesModels);
  const customerTypes = parseCsvParam(searchParams.customerTypes);
  const workingDayStatus = pickFirst(searchParams.workingDayStatus);
  const searchScope = pickFirst(searchParams.searchScope);
  const location = pickFirst(searchParams.location);
  const includeFacets = pickFirst(searchParams.includeFacets) === 'true';

  return {
    page: page && page > 0 ? page : 1,
    limit: limit && limit > 0 ? Math.min(limit, 60) : 20,
    ...(q ? { q } : {}),
    ...(search ? { search } : {}),
    sort,
    remote,
    ...(employmentTypes?.length ? { employmentTypes } : {}),
    ...(salaryMinGte !== undefined && salaryMinGte >= 0 ? { salaryMinGte } : {}),
    ...(salaryMaxLte !== undefined && salaryMaxLte >= 0 ? { salaryMaxLte } : {}),
    ...(postedWithinDays !== undefined && JOBS_POSTED_WITHIN_SET.has(postedWithinDays as 1 | 3 | 7 | 14 | 30) ? { postedWithinDays: postedWithinDays as 1 | 3 | 7 | 14 | 30 } : {}),
    ...(categorySlugs?.length ? { categorySlugs } : {}),
    ...(experienceLevels?.length ? { experienceLevels } : {}),
    ...(companyIndustryKeys?.length ? { companyIndustryKeys } : {}),
    ...(jobFieldKeys?.length ? { jobFieldKeys } : {}),
    ...(companyTypes?.length ? { companyTypes } : {}),
    ...(salaryBands?.length ? { salaryBands } : {}),
    ...(jobLevels?.length ? { jobLevels } : {}),
    ...(salesModels?.length ? { salesModels } : {}),
    ...(customerTypes?.length ? { customerTypes } : {}),
    ...(workingDayStatus ? { workingDayStatus } : {}),
    ...(searchScope ? { searchScope } : {}),
    ...(location ? { location } : {}),
    ...(includeFacets ? { includeFacets } : {}),
  };
}
