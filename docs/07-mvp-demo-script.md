# MVP Demo Script

Audience: product review / technical demo on localhost.

## Demo Prerequisites

1. API and Web are running.
2. Seed already executed.
3. Use seeded credentials below.

## Seeded Accounts

- Admin: `admin@example.com` / `password123`
- Recruiter A: `recruiter.alpha@example.com` / `password123`
- Recruiter B: `recruiter.beta@example.com` / `password123`
- Candidate Anna: `candidate.anna@example.com` / `password123`
- Candidate Bao: `candidate.bao@example.com` / `password123`

## Scenario 1: Candidate Journey (6-8 minutes)

1. Login as `candidate.anna@example.com`.
2. Open candidate dashboard and explain stats cards.
3. Open CV page and show primary CV metadata.
4. Open jobs list and inspect a published role.
5. Apply to one eligible job (if not already applied in session).
6. Open applications page and explain status + match score.

Expected result: candidate can navigate end-to-end, duplicate apply is blocked, dashboard counters reflect activity.

## Scenario 2: Recruiter Journey (6-8 minutes)

1. Login as `recruiter.alpha@example.com`.
2. Open recruiter dashboard and explain job/application counters.
3. Open jobs management and show statuses (`DRAFT`, `PUBLISHED`, `CLOSED`).
4. Open applications review list.
5. Update one application status with valid transition.

Expected result: recruiter sees only own jobs/applications and can transition status according to business rules.

## Scenario 3: Admin Journey (4-6 minutes)

1. Login as `admin@example.com`.
2. Open admin dashboard and explain system-wide metrics.
3. Open users management.
4. Update one non-admin user role/name (optional) and show RBAC guard behavior.

Expected result: admin has platform-level visibility and management controls.

## Troubleshooting During Demo

- If dashboard pages fail to load stats: verify API is running and token is valid (re-login).
- If web build command fails in pre-demo checks: ensure `AUTH_SECRET` is set.
- If data looks inconsistent: rerun seed and restart both servers.