# Release Readiness Acceptance Matrix

Scope: Day 14 validation for MVP localhost release.

## Command Gates (Must Pass)

```bash
npm run lint -w api
npm run test -w api -- --runInBand
npm run test:e2e -w api -- --runInBand
npm run build -w api
npm run lint -w web
$env:AUTH_SECRET='local-test-secret-for-build-only'; npm run build -w web
```

## Role-Based Acceptance Matrix

| Role | Flow | Expected Result | Evidence Source |
|---|---|---|---|
| Candidate | Register/Login | Login succeeds and routes are protected | `apps/web/docs/auth-smoke-checklist.md`, API e2e auth cases |
| Candidate | Profile + CV | Can view/update profile and manage CV data | `apps/web/docs/user-management-smoke-checklist.md`, `apps/web/docs/cv-management-smoke-checklist.md` |
| Candidate | Apply Job | Can apply once, duplicate apply blocked | `apps/web/docs/application-flow-smoke-checklist.md`, API e2e applications cases |
| Candidate | Dashboard | Sees own application counters | `apps/web/docs/dashboard-smoke-checklist.md`, `GET /dashboard/stats` candidate |
| Recruiter | Jobs Lifecycle | Create/edit/publish/close and view own jobs only | `apps/web/docs/job-management-smoke-checklist.md`, API e2e jobs cases |
| Recruiter | Applications Review | Review applications and update valid transitions | `apps/web/docs/application-flow-smoke-checklist.md`, API e2e transition cases |
| Recruiter | Dashboard | Sees own jobs/applications counters | `apps/web/docs/dashboard-smoke-checklist.md`, `GET /dashboard/stats` recruiter |
| Admin | Users Management | List/update/delete users with RBAC enforcement | `apps/web/docs/user-management-smoke-checklist.md`, API e2e users cases |
| Admin | Dashboard | Sees system-wide counters | `apps/web/docs/dashboard-smoke-checklist.md`, `GET /dashboard/stats` admin |

## Coverage Notes

- API coverage is enforced by unit + e2e test runs.
- UI smoke remains checklist-driven for MVP and should be executed on demo environment after seeding.
- Seed data in `apps/api/prisma/seed.ts` provides deterministic accounts and scenario states.
