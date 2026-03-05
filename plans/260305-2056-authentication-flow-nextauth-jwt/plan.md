---
title: "Authentication Flow Plan (NestJS JWT + NextAuth)"
description: "Implement register/login APIs, JWT guard strategy, and NextAuth credentials flow for 3 roles."
status: in_progress
priority: P1
effort: 10h
issue: null
branch: main
tags: [feature, backend, frontend, api, auth]
created: 2026-03-05
---

# Authentication Flow Plan (NestJS JWT + NextAuth)

## Overview

Feature tie to checklist Day 3-4 after database setup: auth API + JWT + login/register UI + end-to-end auth flow.
Keep scope MVP only, localhost only, no OAuth/email verification.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Auth contracts and security baseline | Completed | 1.5h | [phase-01](./phase-01-auth-contract-and-security-baseline.md) |
| 2 | API register/login + JWT strategy | Completed | 3h | [phase-02](./phase-02-api-register-login-jwt.md) |
| 3 | Web NextAuth credentials integration | Completed | 2h | [phase-03](./phase-03-web-nextauth-credentials-integration.md) |
| 4 | Login/register pages + route protection | Completed | 2h | [phase-04](./phase-04-auth-pages-and-route-protection.md) |
| 5 | Testing and hardening | In Progress | 1.5h | [phase-05](./phase-05-auth-testing-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phase 3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- `POST /auth/register` and `POST /auth/login` working with bcrypt + JWT.
- JWT guard validates bearer token and injects user context.
- NextAuth credentials flow calls backend login API and stores session safely.
- Web has working `/login` and `/register`, then redirect by role.
- Auth unit/e2e checks pass in API and basic auth flow is validated in web.

## Risks

- Duplicate auth logic between NestJS and NextAuth.
- JWT/session shape mismatch between API and web.
- Role-based redirect bugs if session payload incomplete.

## Mitigation

- Single source of truth for credentials check in backend only.
- Explicit auth response contract (`user`, `accessToken`, `expiresIn`).
- Add typed session/user mapping in web.

## Unresolved Questions

- Manual browser smoke run for `/login`, `/register`, and role redirects is pending.
