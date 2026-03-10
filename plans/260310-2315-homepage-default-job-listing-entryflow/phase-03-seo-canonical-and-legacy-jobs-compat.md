# Phase 3: SEO, Canonical, and Legacy `/jobs` Compatibility

Status: Completed (2026-03-10)

## Goal

Prevent SEO duplication and maintain old links while migrating default listing route.

## Tasks

1. Canonical policy:
   - `/` should be canonical listing URL.
   - `/jobs` canonical points to `/` (or 301 redirect).
2. Update sitemap generation and internal JSON-LD links to prefer `/`.
3. Verify structured data `SearchAction.target` points to the intended listing route.
4. Add compatibility tests for `/jobs` query forwarding.

## Edge Cases

- Search engines with cached `/jobs` index.
- Social/shared links still referencing `/jobs`.
- Query string normalization (`/jobs?q=backend` -> `/?q=backend`).

## Deliverables

- SEO diff checklist.
- Redirect/canonical decision record.

## Implementation Notes

- Canonical listing URL remains `/` via root metadata.
- Legacy listing route `/jobs` now redirects to `/` with preserved query parameters.
- Removed static `/jobs` listing URL from sitemap to reduce duplicate listing indexing risk.
