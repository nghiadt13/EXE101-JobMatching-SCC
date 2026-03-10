export const PUBLIC_JOBS_LISTING_ROUTE = '/';
export const LEGACY_JOBS_LISTING_ROUTE = '/jobs';

export function buildPublicJobsListingHref(params?: URLSearchParams): string {
  if (!params || params.size === 0) {
    return PUBLIC_JOBS_LISTING_ROUTE;
  }

  return `${PUBLIC_JOBS_LISTING_ROUTE}?${params.toString()}`;
}
