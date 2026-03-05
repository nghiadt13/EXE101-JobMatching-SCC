# Phase 4: AI & Processing Dependencies

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Matching Algorithm](../../docs/04-matching-algorithm.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 15 phút

Cài đặt dependencies cho AI processing bao gồm Gemini API client, PDF/DOCX parsing và TF-IDF matching algorithm.

## Requirements

### Functional Requirements

- Gemini API client cho CV parsing
- PDF text extraction
- DOCX text extraction
- TF-IDF calculation cho matching
- Cosine similarity calculation

### Non-functional Requirements

- Fast text extraction (<2s per file)
- Accurate parsing results
- Memory efficient processing
- Support Vietnamese text

## Architecture

```
apps/api/src/
├── cv-parser/
│   ├── cv-parser.service.ts      # Main parser
│   ├── pdf-extractor.service.ts  # PDF → text
│   ├── docx-extractor.service.ts # DOCX → text
│   └── gemini-parser.service.ts  # Text → structured data
└── matching/
    ├── matching.service.ts        # Main matching
    ├── tfidf.service.ts          # TF-IDF calculation
    └── skills-matcher.service.ts  # Skills comparison
```

## Related Code Files

### Files to Modify

- `apps/api/package.json`

### Files to Create (Later)

- `apps/api/.env` (GEMINI_API_KEY)
- CV parser services
- Matching services

## Implementation Steps

### 1. Gemini API Client

```bash
cd apps/api
npm install @google/generative-ai
```

**Packages:**

- `@google/generative-ai` - Official Gemini API client

### 2. PDF Processing

```bash
npm install pdf-parse
```

**Packages:**

- `pdf-parse` - Extract text from PDF files

### 3. DOCX Processing

```bash
npm install mammoth
```

**Packages:**

- `mammoth` - Extract text from DOCX files

### 4. TF-IDF & NLP

```bash
npm install natural
npm install -D @types/natural
```

**Packages:**

- `natural` - NLP library với TF-IDF support
- `@types/natural` - TypeScript types

### 5. File Upload

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

**Packages:**

- `@nestjs/platform-express` - Express platform (đã có)
- `multer` - File upload middleware
- `@types/multer` - TypeScript types

## Todo List

- [ ] Cài @google/generative-ai
- [ ] Cài pdf-parse
- [ ] Cài mammoth
- [ ] Cài natural và @types/natural
- [ ] Cài multer và @types/multer
- [ ] Verify tất cả packages trong package.json
- [ ] Chạy `npm install` để update lock file
- [ ] Test import các packages

## Success Criteria

- [ ] Tất cả packages cài đặt thành công
- [ ] Có thể import Gemini client
- [ ] pdf-parse có thể parse PDF
- [ ] mammoth có thể parse DOCX
- [ ] natural TF-IDF hoạt động
- [ ] multer có thể handle file upload

## Dependencies Version

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0",
    "natural": "^8.0.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/natural": "^5.1.5",
    "@types/multer": "^1.4.12"
  }
}
```

## Usage Examples

### PDF Extraction

```typescript
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('cv.pdf');
const data = await pdf(dataBuffer);
console.log(data.text);
```

### DOCX Extraction

```typescript
import mammoth from 'mammoth';

const result = await mammoth.extractRawText({ path: 'cv.docx' });
console.log(result.value);
```

### Gemini Parsing

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const prompt = `Parse this CV and extract: name, email, phone, skills, experience, education\n\n${cvText}`;
const result = await model.generateContent(prompt);
```

### TF-IDF Matching

```typescript
import natural from 'natural';

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

tfidf.addDocument(cvText);
tfidf.addDocument(jdText);

// Calculate similarity
const cvVector = tfidf.listTerms(0);
const jdVector = tfidf.listTerms(1);
```

## Risk Assessment

**Risks:**

- pdf-parse có thể fail với scanned PDFs
- mammoth không support tất cả DOCX formats
- Gemini API rate limits
- natural.js performance với large documents

**Mitigation:**

- Chỉ support text-based PDFs (no OCR)
- Validate DOCX format trước khi parse
- Implement rate limiting và retry logic
- Cache TF-IDF calculations

## Environment Variables

Cần thêm vào `apps/api/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Next Steps

Sau khi hoàn thành phase này:

- Phase 5: Cài đặt Dev Dependencies
- Setup Gemini API key
- Implement CV parser service
- Implement matching service
