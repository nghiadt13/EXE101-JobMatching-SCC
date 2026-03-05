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

- [ ] Open `/jobs` without login and verify only published jobs are listed.
- [ ] Open `/jobs/[slug]` for published job and verify detail renders.
- [ ] Try opening slug of draft/closed job and verify not found.

## Negative/Access Cases

- [ ] Candidate cannot access recruiter mutation endpoints.
- [ ] Recruiter cannot update/delete jobs that belong to another recruiter.
- [ ] Invalid lifecycle transition (`DRAFT -> CLOSE`) is rejected with `400`.
