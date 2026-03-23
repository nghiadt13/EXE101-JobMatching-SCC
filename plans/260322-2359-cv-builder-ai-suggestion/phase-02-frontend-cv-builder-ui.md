# Phase 2: Frontend CV Builder UI (Form + Preview + Templates)

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1: Backend API](./phase-01-prisma-schema-backend-cv-builder-api.md)
- [OpenResume ResumeForm](https://github.com/xitanggg/open-resume/tree/main/src/app/components/ResumeForm)
- [OpenResume Resume/ResumePDF](https://github.com/xitanggg/open-resume/tree/main/src/app/components/Resume/ResumePDF)

## Overview

**Priority:** P1
**Status:** Not Started
**Estimate:** 16h
**Depends on:** Phase 1

Xây dựng frontend CV builder: template gallery, split-screen editor (form bên trái + live preview bên phải), và PDF export. Tham khảo OpenResume component structure.

## Key Insights

- OpenResume dùng Redux → mình dùng React `useState` + API calls (đơn giản hơn).
- OpenResume dùng `@react-pdf/renderer` render trong iframe → giữ approach này.
- OpenResume có 6 section forms (Profile, WorkExperience, Education, Project, Skills, Custom) → mình tạo tương tự.
- Project hiện tại dùng Next.js 16 + Tailwind CSS → `react-pdf` cần `"use client"` + dynamic import (`ssr: false`).

## File Structure

```
apps/web/
├── app/dashboard/candidate/cvs/
│   ├── create/
│   │   └── page.tsx                     ← CV Builder page (split-screen)
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx                 ← Edit builder CV page
│   └── templates/
│       └── page.tsx                     ← Template gallery page
│
├── components/cv/
│   ├── builder/
│   │   ├── cv-builder-page.tsx          ← Main split-screen layout
│   │   ├── cv-builder-form.tsx          ← Form container (sections list)
│   │   ├── cv-preview.tsx               ← Preview container (iframe + controls)
│   │   ├── preview-iframe.tsx           ← Iframe wrapper for react-pdf
│   │   ├── preview-controls.tsx         ← Download PDF + zoom slider
│   │   ├── theme-picker.tsx             ← Template + accent color switcher
│   │   ├── sections/
│   │   │   ├── profile-section.tsx      ← Name, email, phone, summary, location
│   │   │   ├── experience-section.tsx   ← Work entries (add/remove/reorder)
│   │   │   ├── education-section.tsx    ← Education entries
│   │   │   ├── skills-section.tsx       ← Skills chips input
│   │   │   ├── projects-section.tsx     ← Project entries
│   │   │   └── extras-section.tsx       ← Certifications + Languages
│   │   └── pdf/
│   │       ├── resume-pdf.tsx           ← Main react-pdf Document
│   │       ├── pdf-profile.tsx          ← PDF profile section renderer
│   │       ├── pdf-experience.tsx       ← PDF experience renderer
│   │       ├── pdf-education.tsx        ← PDF education renderer
│   │       ├── pdf-skills.tsx           ← PDF skills renderer
│   │       ├── pdf-projects.tsx         ← PDF projects renderer
│   │       └── pdf-styles.ts            ← react-pdf StyleSheet (3 templates)
│   │
│   ├── cv-list.tsx                      ← MODIFY: add "Tạo CV" button + badge
│   └── cv-template-gallery.tsx          ← Template selection cards (3 templates)
│
├── lib/
│   └── api.ts                           ← MODIFY: add createCv(), updateBuilderCv() API calls
│
└── types/
    └── cv-builder.ts                    ← Shared types for builder
```

## Requirements

### Template Gallery (`/dashboard/candidate/cvs/templates`)

- Grid 3 cards: Simple, Professional, Modern
- Each card: thumbnail preview + tên + mô tả + nút "Dùng mẫu này"
- "Dùng mẫu này" → navigate `/dashboard/candidate/cvs/create?template=simple`

### Split-Screen Builder (`/dashboard/candidate/cvs/create`)

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Quay lại]                  CV Builder                       │
├────────────────────────────┬─────────────────────────────────────┤
│  Form (50% width, scroll)  │  Preview (50% width, fixed)        │
│                            │                                     │
│  ┌── Thông tin cá nhân ──┐ │  ┌─────────────────────────────┐   │
│  │ Họ tên: [          ]  │ │  │                             │   │
│  │ Email:  [          ]  │ │  │    (react-pdf A4 preview)   │   │
│  │ SĐT:   [          ]  │ │  │                             │   │
│  │ Mục tiêu: [       ]  │ │  │                             │   │
│  └───────────────────────┘ │  └─────────────────────────────┘   │
│                            │                                     │
│  ┌── Kinh nghiệm ───────┐ │  ┌─────────────────────────────┐   │
│  │ [+ Thêm kinh nghiệm] │ │  │  [🔍 Zoom] [📥 Tải PDF]    │   │
│  │ Entry 1               │ │  │  [🎨 Đổi mẫu]             │   │
│  │ Entry 2               │ │  └─────────────────────────────┘   │
│  └───────────────────────┘ │                                     │
│                            │                                     │
│  ┌── Học vấn ────────────┐ │                                     │
│  ┌── Kỹ năng ───────────┐ │                                     │
│  ┌── Dự án ─────────────┐ │                                     │
│  ┌── Khác ──────────────┐ │                                     │
│                            │                                     │
│  [💾 Lưu CV]   [💡 AI]    │                                     │
├────────────────────────────┴─────────────────────────────────────┤
│  Mobile: form full width, preview hidden, toggle button          │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```typescript
// Page state
const [cvData, setCvData] = useState<CvBuilderData>(initialData);
const [templateId, setTemplateId] = useState("simple");
const [isSaving, setIsSaving] = useState(false);

// Form → state (real-time, mỗi keystroke)
<ProfileSection data={cvData.profile} onChange={(profile) => setCvData({...cvData, profile})} />

// State → preview (auto, useMemo)
const pdfDocument = useMemo(() => <ResumePDF data={cvData} templateId={templateId} />, [cvData, templateId]);

// Save → API (onClick or debounced auto-save)
const handleSave = async () => {
  setIsSaving(true);
  const result = await createCv(cvData);  // POST /api/cvs/create
  router.push(`/dashboard/candidate/cvs/${result.id}/edit`);
};
```

### 3 Templates PDF Styles

| Template | Visual |
|----------|--------|
| `simple` | Single column, clean lines, ATS-friendly. Font: Helvetica. |
| `professional` | 2-column (sidebar contact + main content). Accent color header. |
| `modern` | Full-width sections with colorful section headers. Modern typography. |

All 3 read same `CvBuilderData`, chỉ khác layout/styles trong `pdf-styles.ts`.

## Implementation Steps

### Step 1: Install dependencies (~10min)
```powershell
cd d:\Education\EXE101\JobMatchingMVP\apps\web
npm install @react-pdf/renderer
```

### Step 2: Shared types (`types/cv-builder.ts`) (~30min)
- Define `CvBuilderData`, `CvProfile`, `CvExperience`, `CvEducation`, `CvProject`
- Map to backend `CreateCvDto`

### Step 3: API client (`lib/api.ts`) (~30min)
- `createCv(data: CvBuilderData): Promise<CvView>`
- `updateBuilderCv(id: string, data: CvBuilderData): Promise<CvView>`

### Step 4: Section form components (~4h)
- `profile-section.tsx`: inputs for name, email, phone, website, summary, location
- `experience-section.tsx`: dynamic list with add/remove/reorder buttons
- `education-section.tsx`: dynamic list
- `skills-section.tsx`: tag/chip input
- `projects-section.tsx`: dynamic list
- `extras-section.tsx`: certifications + languages (string lists)

### Step 5: PDF renderer components (~4h)
- `resume-pdf.tsx`: main `<Document>` with template switching
- `pdf-profile.tsx`, `pdf-experience.tsx`, `pdf-education.tsx`, `pdf-skills.tsx`, `pdf-projects.tsx`
- `pdf-styles.ts`: 3 template styles

### Step 6: Preview container (~2h)
- `preview-iframe.tsx`: iframe wrapper (ref: OpenResume `ResumeIFrame.tsx`)
- `preview-controls.tsx`: zoom slider + download button
- `cv-preview.tsx`: container combining iframe + controls

### Step 7: Builder page + form container (~2h)
- `cv-builder-page.tsx`: split-screen grid layout
- `cv-builder-form.tsx`: sections list + save button
- `create/page.tsx`: load template from query param, render builder
- `[id]/edit/page.tsx`: load existing CV data from API, render builder

### Step 8: Template gallery (~1h)
- `cv-template-gallery.tsx`: 3 cards with static preview images
- `templates/page.tsx`: gallery page

### Step 9: Update cv-list.tsx (~1h)
- Add "Tạo CV mới" button linking to `/dashboard/candidate/cvs/templates`
- Add badge `Builder` / `Uploaded` on each CV card based on `source` field

### Step 10: Build verification (~1h)
```powershell
npm run lint -w web
$env:AUTH_SECRET='test'; npm run build -w web
```

## Todo List

- [ ] `@react-pdf/renderer` installed
- [ ] `types/cv-builder.ts` created
- [ ] API client functions added to `lib/api.ts`
- [ ] 6 section form components created
- [ ] 5 PDF renderer components + styles created
- [ ] Preview iframe + controls created
- [ ] `cv-builder-page.tsx` split-screen layout
- [ ] `/create` page route working
- [ ] `/[id]/edit` page route working
- [ ] Template gallery page
- [ ] `cv-list.tsx` updated with builder button + badge
- [ ] Web lint + build pass

## Success Criteria

- [ ] Candidate sees template gallery with 3 options.
- [ ] Clicking template opens builder with correct template.
- [ ] Form changes reflect in preview in real-time.
- [ ] CV saves to backend and appears in CV list.
- [ ] Edit page loads existing builder CV data correctly.
- [ ] PDF downloads correctly with selected template.
- [ ] Mobile responsive (form full width, preview toggleable).
- [ ] Builder CVs show "Builder" badge in CV list.

## Next Steps

- Phase 3: Build AI CV Suggestion backend.
- Phase 4: Integrate AI suggestion panel into builder UI.
