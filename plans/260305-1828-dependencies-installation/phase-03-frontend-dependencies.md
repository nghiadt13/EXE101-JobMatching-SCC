# Phase 3: Frontend Dependencies

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 20 phút

Cài đặt dependencies cho Next.js frontend bao gồm NextAuth.js, UI components, form handling và HTTP client.

## Requirements

### Functional Requirements

- NextAuth.js v5 cho authentication
- shadcn/ui components cho UI
- Form validation và handling
- HTTP client cho API calls

### Non-functional Requirements

- Type-safe API calls
- Accessible UI components
- Responsive design support
- Dark mode ready

## Architecture

```
apps/web/
├── app/
│   ├── (auth)/          # Auth pages
│   ├── (dashboard)/     # Dashboard pages
│   └── api/auth/        # NextAuth API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   └── forms/           # Form components
└── lib/
    ├── auth.ts          # NextAuth config
    └── api-client.ts    # HTTP client
```

## Related Code Files

### Files to Modify

- `apps/web/package.json`

### Files to Create (Later)

- `apps/web/.env.local`
- `apps/web/lib/auth.ts`
- `apps/web/components/ui/*`

## Implementation Steps

### 1. NextAuth.js v5

```bash
cd apps/web
npm install next-auth@beta
```

**Packages:**

- `next-auth@beta` - NextAuth.js v5 (beta)

### 2. shadcn/ui Setup

```bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node
```

**Packages:**

- `@radix-ui/react-slot` - Radix UI primitives
- `class-variance-authority` - CVA for variants
- `clsx` - Conditional classnames
- `tailwind-merge` - Merge Tailwind classes
- `lucide-react` - Icon library

### 3. Form Handling

```bash
npm install react-hook-form @hookform/resolvers zod
```

**Packages:**

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation

### 4. HTTP Client

```bash
npm install axios
```

**Packages:**

- `axios` - HTTP client với interceptors

### 5. UI Utilities

```bash
npm install sonner
```

**Packages:**

- `sonner` - Toast notifications

### 6. shadcn/ui CLI (Optional)

```bash
npx shadcn@latest init
```

Chọn:

- Style: Default
- Base color: Slate
- CSS variables: Yes

## Todo List

- [ ] Cài NextAuth.js v5 beta
- [ ] Cài shadcn/ui dependencies
- [ ] Cài form handling packages
- [ ] Cài axios
- [ ] Cài sonner cho notifications
- [ ] Run shadcn init (optional)
- [ ] Verify tất cả packages trong package.json
- [ ] Chạy `npm install` để update lock file

## Success Criteria

- [ ] Tất cả packages cài đặt thành công
- [ ] NextAuth types available
- [ ] shadcn/ui components có thể import
- [ ] Form validation hoạt động
- [ ] `npm run build` compile thành công
- [ ] Dev server có thể start

## Dependencies Version

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "next-auth": "^5.0.0-beta.25",
    "@radix-ui/react-slot": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^3.9.1",
    "zod": "^3.24.1",
    "axios": "^1.7.9",
    "sonner": "^1.7.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## shadcn/ui Components to Install

Sau khi setup xong, có thể cài các components cần thiết:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
```

## Risk Assessment

**Risks:**

- NextAuth v5 beta có thể có breaking changes
- shadcn/ui cần Tailwind CSS 4 config
- React 19 compatibility issues

**Mitigation:**

- Pin NextAuth version trong package.json
- Follow shadcn/ui docs cho Tailwind 4
- Test components sau khi cài

## Next Steps

Sau khi hoàn thành phase này:

- Phase 4: Cài đặt AI & Processing Dependencies
- Setup NextAuth.js config
- Install shadcn/ui components
