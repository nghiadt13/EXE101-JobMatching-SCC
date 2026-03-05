# Phase 5: Dev Dependencies & Config

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Code Standards](../../docs/code-standards.md) (if exists)

## Overview

**Priority:** 🟡 Medium
**Status:** ⬜ Pending
**Thời gian ước tính:** 15 phút

Cài đặt shared dev dependencies và config files cho code quality, formatting và testing.

## Requirements

### Functional Requirements

- Shared ESLint config cho monorepo
- Shared Prettier config
- TypeScript config inheritance
- Testing utilities

### Non-functional Requirements

- Consistent code style across apps
- Fast linting và formatting
- Type checking hoạt động đúng
- Easy to maintain configs

## Architecture

```
hr-recruitment-platform/
├── .eslintrc.json         # Shared ESLint config
├── .prettierrc            # Shared Prettier config
├── tsconfig.base.json     # Base TypeScript config
├── apps/
│   ├── web/
│   │   └── tsconfig.json  # Extends base
│   └── api/
│       └── tsconfig.json  # Extends base
└── package.json
```

## Related Code Files

### Files to Modify

- `package.json` (root)

### Files to Create

- `.eslintrc.json`
- `.prettierrc`
- `.prettierignore`
- `tsconfig.base.json`

## Implementation Steps

### 1. Prettier (Root)

```bash
npm install -D prettier
```

**Config `.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

**Config `.prettierignore`:**

```
node_modules
dist
build
.next
coverage
package-lock.json
```

### 2. ESLint (Root - Optional)

```bash
npm install -D eslint
```

**Note:** Web và API đã có ESLint riêng, có thể skip shared config.

### 3. TypeScript Base Config

Tạo `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true
  }
}
```

### 4. Update App Configs

**apps/web/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**apps/api/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

### 5. Add Format Scripts

Update root `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

## Todo List

- [ ] Cài Prettier ở root
- [ ] Tạo `.prettierrc` config
- [ ] Tạo `.prettierignore`
- [ ] Tạo `tsconfig.base.json`
- [ ] Update `apps/web/tsconfig.json` để extend base
- [ ] Update `apps/api/tsconfig.json` để extend base
- [ ] Add format scripts vào root package.json
- [ ] Test `npm run format` command
- [ ] Test TypeScript compilation

## Success Criteria

- [ ] Prettier format hoạt động
- [ ] TypeScript compilation không lỗi
- [ ] Configs được share đúng cách
- [ ] Format scripts chạy thành công
- [ ] Code style consistent

## Dependencies Version

```json
{
  "devDependencies": {
    "prettier": "^3.4.2"
  }
}
```

## Commands to Test

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint all apps
npm run lint

# Type check
npm -w web tsc --noEmit
npm -w api tsc --noEmit
```

## Risk Assessment

**Risks:**

- Prettier conflicts với existing ESLint rules
- TypeScript config inheritance issues
- Format scripts quá chậm với large codebase

**Mitigation:**

- Disable conflicting ESLint rules
- Test configs sau khi setup
- Use `.prettierignore` để skip unnecessary files

## Optional Enhancements

### Husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

**`.husky/pre-commit`:**

```bash
npx lint-staged
```

**`package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Commitlint

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

## Next Steps

Sau khi hoàn thành phase này:

- Setup git hooks (optional)
- Configure CI/CD linting
- Document code standards
