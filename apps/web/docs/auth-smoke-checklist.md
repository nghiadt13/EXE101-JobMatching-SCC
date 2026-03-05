# Auth Smoke Checklist

- [ ] Register candidate account and auto-login redirects to `/dashboard/candidate`.
- [ ] Register recruiter account and auto-login redirects to `/dashboard/recruiter`.
- [ ] Login with seeded admin account redirects to `/dashboard/admin`.
- [ ] Invalid login shows a safe error message and does not leak backend details.
- [ ] Accessing `/dashboard` while logged out redirects to `/login`.
- [ ] Accessing `/login` or `/register` while logged in redirects to role dashboard.
- [ ] Sign out returns to `/login` and protected routes are blocked again.
