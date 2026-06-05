const fs = require('fs');
const path = 'f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

// Fix datasource
code = code.replace(
  `datasource db {\n  provider = "postgresql"\n}`,
  `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`
);

// Add embedding to CV
if (!code.includes('embedding Unsupported("vector(768)")?')) {
  // It's not in CV
  code = code.replace(
    `  source                  String    @default("upload")`,
    `  embedding               Unsupported("vector(768)")?\n  source                  String    @default("upload")`
  );
  code = code.replace(
    `  @@index([deletedAt])\n}`,
    `  @@index([deletedAt])\n  @@index([embedding(ops: vector_cosine_ops)], type: Hnsw)\n}`
  );
}

// Add embedding to Job
// We replaced `source` for CV, for Job let's replace `shortDescription`
if (code.split('embedding Unsupported("vector(768)")?').length < 3) {
  // Only RagKnowledge and CV have it
  code = code.replace(
    `  shortDescription          String?`,
    `  shortDescription          String?\n  embedding                 Unsupported("vector(768)")?`
  );
  code = code.replace(
    `  @@index([salaryNegotiable])\n}`,
    `  @@index([salaryNegotiable])\n  @@index([embedding(ops: vector_cosine_ops)], type: Hnsw)\n}`
  );
}

// Fix RagKnowledge index
code = code.replace(
  `  // @@index([embedding(ops: vector_cosine_ops)], type: Hnsw)\n}`,
  `  @@index([embedding(ops: vector_cosine_ops)], type: Hnsw)\n}`
);

// Add pgvector extension if not exists
if (!code.includes('postgresqlExtensions')) {
  code = code.replace(
    `generator client {\n  provider = "prisma-client-js"\n  output   = "../../../node_modules/.prisma/client"\n}`,
    `generator client {\n  provider        = "prisma-client-js"\n  output          = "../../../node_modules/.prisma/client"\n  previewFeatures = ["postgresqlExtensions"]\n}\n`
  );
  code = code.replace(
    `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`,
    `datasource db {\n  provider   = "postgresql"\n  url        = env("DATABASE_URL")\n  extensions = [vector]\n}`
  );
}

fs.writeFileSync(path, code);
console.log('Fixed schema.prisma');
