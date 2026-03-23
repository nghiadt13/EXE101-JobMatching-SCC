# Phase 1: Homepage New Sections

## Context Links

- Related plan: [plan.md](./plan.md)
- Relevant files:
  - `../../apps/web/components/home/homepage-main.tsx`
  - `../../apps/web/app/globals.css`

## Overview

- Priority: P1
- Status: In Progress
- Brief: Add 4 new TopCV-inspired sections to the homepage between existing sections.

## Current Homepage Section Order

1. Hero (search bar)
2. Market Stats (charts)
3. Trusted Companies (logos)
4. Explore by Category (cards)
5. Best Jobs For You (job grid)
6. How HireStream Works (steps)
7. Footer

## New Section Order (after upgrade)

1. Hero (search bar)
2. Market Stats (charts)
3. Trusted Companies (logos)
4. **🆕 Top Employers** – Grid of employer cards with logo, name, open positions count
5. Explore by Category (cards)
6. Best Jobs For You (job grid)
7. **🆕 Why Choose HireStream** – 4 feature cards (AI Matching, Verified Employers, Notifications, Career Insights)
8. How HireStream Works (steps)
9. **🆕 Career Blog / News** – 3 article preview cards
10. **🆕 Create CV CTA Banner** – Full-width gradient banner
11. Footer

## Implementation Steps

1. Add "Top Employers" section after Trusted Companies with 6-8 employer cards
2. Add "Why Choose HireStream" section after Best Jobs with 4 feature highlight cards
3. Add "Career Blog / News" section after How It Works with 3 mock article cards
4. Add "Create Your CV" CTA banner before Footer
5. Add supporting CSS classes in `globals.css`

## Todo List

- [ ] Top Employers section with employer cards
- [ ] Why Choose HireStream section with feature cards
- [ ] Career Blog section with article cards
- [ ] CTA Banner section
- [ ] New CSS classes for animations/gradients

## Success Criteria

- All 4 new sections render correctly on the homepage
- Hover animations work on employer and feature cards
- CTA button links to `/dashboard/candidate/cvs`
- No regression on existing sections
