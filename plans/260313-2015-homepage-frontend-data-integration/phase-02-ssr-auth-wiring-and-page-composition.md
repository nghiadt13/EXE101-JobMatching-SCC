# Phase 2: SSR/Auth Wiring and Page Composition

Status: Proposed

## Goal

Fetch homepage data on server render with optional user token and pass stable props to UI layer.

## Tasks

1. Update `apps/web/app/page.tsx`:
   - get session via `auth()`
   - read `session?.accessToken` if available
   - call `getHomepage(...)` on server side
2. Pass fetched payload to `HomepageMain` via props.
3. Define safe fallback if API call fails:
   - keep UI shell rendered
   - pass minimal empty payload + error marker
4. Keep metadata unchanged unless dynamic SEO is explicitly required.

## Deliverables

- Page-level SSR data wiring for homepage
- Prop-based contract between page and homepage component

## Exit Criteria

- Guest visits and logged-in visits both return homepage with correct user block behavior.
- No client-side hydration mismatch from SSR payload.

