# Database Gap Analysis - Homepage Dynamic Data

## 1) UI to backend data mapping

### Header

- UI needs: user avatar, user name, plan label, unread notification badge.
- Required data:
  - `currentUser.id`
  - `currentUser.name`
  - `currentUser.avatarUrl`
  - `currentUser.planName`
  - `currentUser.unreadNotificationCount`

### Hero Section

- UI needs: headline, subheadline, background image, popular keywords.
- Required data:
  - `hero.headline`
  - `hero.subheadline`
  - `hero.backgroundImageUrl`
  - `hero.popularKeywords[]`

### Market Stats + Charts

- UI needs: 3 KPI numbers, growth line chart, industry demand bar chart.
- Required data:
  - `marketStats.asOfDate`
  - `marketStats.newJobs24h`
  - `marketStats.activeJobs`
  - `marketStats.hiringCompanies`
  - `jobGrowthSeries[]` (`date`, `value`)
  - `demandByIndustry[]` (`industryKey`, `label`, `value`, `order`)

### Trusted Companies

- UI needs: trusted company list.
- Required data:
  - `trustedCompanies[]`:
    - `companyId`
    - `name`
    - `logoUrl` (nullable)
    - `brandIconKey` (icon fallback)

### Explore by Category

- UI needs: category cards and opening counts.
- Required data:
  - `categories[]`:
    - `id`
    - `slug`
    - `name`
    - `iconKey`
    - `openJobsCount`

### Best Jobs For You

- UI needs: location chips and featured jobs.
- Required data:
  - `locationFilters[]`:
    - `slug`
    - `label`
    - `jobCount`
  - `featuredJobs[]`:
    - `id`
    - `slug`
    - `title`
    - `companyName`
    - `companyLogoUrl`
    - `companyIconKey`
    - `shortDescription`
    - `salaryText`
    - `locationLabel`
    - `isSaved`

### Footer

- UI needs: quick links, support links, social links, copyright text.
- Required data:
  - `footer.quickLinks[]`
  - `footer.supportLinks[]`
  - `footer.socialLinks[]`
  - `footer.copyrightText`

## 2) Current Prisma schema vs required homepage data

Current schema already includes core entities:

- `User`, `Candidate`, `Job`, `Application`, `CV`, `Skill`.

However, a dynamic homepage needs additional data groups not fully covered yet:

1. Homepage CMS content:
   - Hero text, keyword list, footer links.
2. Metrics snapshots:
   - Daily market stats.
   - Daily industry demand.
3. User job save state:
   - Many-to-many relation for heart/save action.
4. Homepage-ready company metadata:
   - `isTrusted`, logo/icon fallback fields.
5. Category metadata:
   - Icon key and sort order.
6. Job short summary:
   - Current `description` is long; homepage needs stable `shortDescription`.

## 3) Proposed tables/columns

### A. `Company` (if not present yet)

- id, name, slug, logoUrl, iconKey, isTrusted, createdAt, updatedAt.

### B. `JobCategory` (if not present yet)

- id, slug, name, iconKey, sortOrder, createdAt, updatedAt.

### C. Add columns to `Job`

- `companyId` (FK -> Company)
- `categoryId` (FK -> JobCategory)
- `shortDescription` (short text for cards)
- `locationLabel` (optional denormalized display text)

### D. `SavedJob`

- userId, jobId, createdAt
- unique(userId, jobId)

### E. `HomepageContent`

- slug (`home-main`)
- heroHeadline, heroSubheadline, heroBackgroundImageUrl
- popularKeywords (jsonb)
- footerQuickLinks (jsonb)
- footerSupportLinks (jsonb)
- footerSocialLinks (jsonb)
- updatedAt

### F. `MarketStatDaily`

- date (unique)
- newJobs24h
- activeJobs
- hiringCompanies
- createdAt

### G. `IndustryDemandDaily`

- id
- date
- industryKey
- industryLabel
- demandValue
- sortOrder
- unique(date, industryKey)

## 4) Backend fields that should be pre-formatted

- `salaryText`:
  - If `salaryMin/salaryMax` exists -> return formatted salary text.
  - Otherwise -> return `"Negotiable"`.
- `locationLabel`:
  - Build from `Job.location` JSON or use denormalized `locationLabel`.
- `isSaved`:
  - Resolve by joining `SavedJob` with current user.
- `openJobsCount`:
  - Count jobs where `status = PUBLISHED` and `deletedAt IS NULL`.

## 5) Core query rules

- `featuredJobs`: only `PUBLISHED`, sorted by `publishedAt DESC` (or ranking score if available).
- `trustedCompanies`: `isTrusted = true` and has at least one published job.
- `locationFilters`: top locations by published job count.
- `marketStats`: latest record from `MarketStatDaily`.
- Charts: last 30 days from snapshot tables.

## 6) Risks if schema is not extended

- Frontend must handle unstable formatting logic itself.
- Homepage query becomes expensive due to runtime aggregations.
- No editable content source for homepage copy/links.
- Save-job heart state cannot persist per user.

## 7) Backend handoff conclusion

Backend should use the SQL draft to add the minimum schema, then implement the contract in `openapi-homepage-v1.yaml`. Once that contract is live, frontend can replace all hardcoded homepage data with API responses without changing UI structure.
