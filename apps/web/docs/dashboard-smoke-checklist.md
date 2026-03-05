# Dashboard Smoke Checklist

## Candidate

- Login with candidate account.
- Open `/dashboard/candidate`.
- Verify stats cards show `Total applications`, `Pending / Reviewing`, `Interviews`.
- Compare numbers with `/dashboard/candidate/applications` list.

## Recruiter

- Login with recruiter account.
- Open `/dashboard/recruiter`.
- Verify stats cards show `Total jobs`, `Published jobs`, `Applications`, `Pending review`.
- Confirm values only reflect recruiter-owned jobs/applications.

## Admin

- Login with admin account.
- Open `/dashboard/admin`.
- Verify stats cards show `Total users`, `Recruiters`, `Candidates`, `Jobs`, `Applications`.
- Confirm all values are system-wide counters.

## Error/Loading UX

- Temporarily stop API and open each role dashboard.
- Verify friendly error message appears and page still renders action links.
- Start API again and hard refresh; confirm loading skeleton appears before data.