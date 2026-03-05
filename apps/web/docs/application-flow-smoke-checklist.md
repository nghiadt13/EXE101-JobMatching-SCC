# Application Flow Smoke Checklist

## Candidate

- Login with candidate account.
- Open a published job detail page.
- Select CV and submit apply.
- Confirm success message appears and duplicate apply is blocked.
- Open `/dashboard/candidate/applications` and verify status + score render.

## Recruiter

- Login with recruiter account.
- Open `/dashboard/recruiter/applications`.
- Verify list contains applications for recruiter-owned jobs only.
- Update one application status with valid transition.
- Verify invalid transition is rejected by API/UI flow.

## API

- `POST /applications` creates record and persists `matchScore`, `tfidfScore`, `skillsScore`.
- `GET /applications` respects role visibility.
- `PATCH /applications/:id/status` enforces transition matrix.
