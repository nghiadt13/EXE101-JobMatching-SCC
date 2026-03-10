# Job Management Smoke Checklist

## Recruiter Flow

- [ ] Login with recruiter account.
- [ ] Open `/dashboard/recruiter/jobs`.
- [ ] Create draft job with title/description/skills.
- [ ] Verify job appears in recruiter list as `DRAFT`.
- [ ] Open recruiter job detail page and update fields.
- [ ] Publish draft job and verify status becomes `PUBLISHED`.
- [ ] Close published job and verify status becomes `CLOSED`.
- [ ] Delete a recruiter job and verify it disappears from list.

## Public/Candidate Visibility

- [ ] Open `/` as guest and verify search submits to `/?q=...`.
- [ ] Verify featured jobs section renders only published jobs.
- [ ] Open `/` without login and verify only published jobs are listed.
- [ ] Open `/jobs` and verify it redirects to `/` while preserving query params.
- [ ] Apply filters on `/` (keyword, remote, salary, employment type) and verify URL query syncs.
- [ ] Use browser back/forward and verify filter state is restored from URL.
- [ ] Verify sort selector (`newest`, `salary_asc`, `salary_desc`) updates listing.
- [ ] Verify pagination keeps current filter query.
- [ ] Open `/jobs/[slug]` for published job and verify detail renders.
- [ ] Try opening slug of draft/closed job and verify not found.
- [ ] Verify `/` query-heavy URL returns `noindex,follow` metadata policy.

## Negative/Access Cases

- [ ] Candidate cannot access recruiter mutation endpoints.
- [ ] Recruiter cannot update/delete jobs that belong to another recruiter.
- [ ] Invalid lifecycle transition (`DRAFT -> CLOSE`) is rejected with `400`.
- [ ] Without consent, `home_search_submitted` and `apply_attempted` events are not emitted.
