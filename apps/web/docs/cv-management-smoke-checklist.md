# CV Management Smoke Checklist

## Candidate Positive Flow

- [ ] Login with candidate account.
- [ ] Open `/dashboard/candidate/cvs`.
- [ ] Upload valid PDF under 5MB.
- [ ] Verify uploaded CV appears in list.
- [ ] Verify first CV is marked `Primary CV`.
- [ ] Update parsed skills and summary.
- [ ] Verify updated values render after refresh.
- [ ] Upload second CV and set it as primary.
- [ ] Verify previous primary CV is unset.
- [ ] Delete primary CV and verify another active CV becomes primary.

## Negative Cases

- [ ] Try uploading unsupported file type (`.txt`) and verify request rejected.
- [ ] Try uploading file over 5MB and verify request rejected.
- [ ] Login with recruiter/admin and verify cannot access candidate CV route.
- [ ] Ensure API errors do not expose server file paths.
