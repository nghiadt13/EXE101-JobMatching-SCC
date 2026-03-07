# Application Flow Smoke Checklist

## Candidate

- Login with candidate account.
- Open `/jobs` and verify published jobs show clear "View details and apply" action.
- Open a published job detail page.
- Select CV and submit apply.
- Confirm success message appears and duplicate apply is blocked with explicit feedback.
- Verify missing CV selection or apply failure states show clear error messages.
- Open `/dashboard/candidate/applications` and verify status + score render.

## Recruiter

- Login with recruiter account.
- Confirm recruiter cannot apply via `POST /applications` (expect `403`).
- Open `/dashboard/recruiter/applications`.
- Verify list contains applications for recruiter-owned jobs only.
- Update one application status with valid transition.
- Verify invalid transition is rejected by API/UI flow.

## API

- `POST /applications` creates record and persists `matchScore` + `matchingSnapshot` (`schema_v1`).
- `POST /applications` rejects non-candidate role and non-published jobs.
- `GET /applications` respects role visibility.
- `PATCH /applications/:id/status` enforces transition matrix.
