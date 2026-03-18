---
title: "Detailed Matching Results Display"
description: "Upgrade matching result view to show detailed explanations with overall fit summary, score composition, and per-requirement evidence"
status: pending
priority: P2
effort: 2.5h
tags: [frontend, backend, matching, ui]
created: 2026-03-18
---

# Detailed Matching Results Display

## Overview

Upgrade the matching result view from a basic score display to a detailed, explanatory format with 3 sections: Overall Fit Summary, Score Composition, and Evidence Details. Requires enriching backend snapshot data with requirement labels and redesigning the frontend component.

**Problem:** Current `MatchingSnapshotV2View` only shows raw scores + short strength/gap labels. Recruiters need to understand *why* a candidate fits.

**Solution:** Enrich backend snapshot with labels → Redesign frontend into 3-section layout.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Backend: Enrich Snapshot | Pending | 30min | [phase-01](./phase-01-backend-enrich-snapshot.md) |
| 2 | Frontend: Update Types | Pending | 10min | [phase-02](./phase-02-frontend-update-types.md) |
| 3 | Frontend: Redesign Component | Pending | 1.5h | [phase-03](./phase-03-frontend-redesign-component.md) |
| 4 | Verification | Pending | 20min | [phase-04](./phase-04-verification.md) |

## Dependencies

- Phase 2 depends on Phase 1 (types must match backend)
- Phase 3 depends on Phase 2 (component uses updated types)
- Phase 4 depends on all above

## Key Decisions

- **No DB migration needed** — enrichment happens at snapshot build time
- **Backward compatible** — old snapshots without labels fall back to `requirementId`
- **No new API endpoints** — data flows through existing `matchingSnapshot` field
