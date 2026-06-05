import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CvAiParserService } from '../src/cvs/services/cv-ai-parser.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SkillStorageAdapterService } from '../src/matching/services/skill-storage-adapter.service';
import { CandidateProfileService } from '../src/matching/services/candidate-profile.service';
import { VectorSyncService } from '../src/matching/rag/vector-sync.service';
import { DocumentTextExtractorService } from '../src/documents/services/document-text-extractor.service';
import { DocumentStorageService } from '../src/documents/services/document-storage.service';
import { Prisma } from '@prisma/client';
import { NormalizedProfile } from '../src/normalization/normalization.types';
import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { CV_MAX_TEXT_CHARS } from '../src/cvs/cvs.constants';

// Define helper interfaces matching the DB structures
interface ParsedDataRecord {
  normalizedProfile?: Record<string, unknown>;
  [key: string]: unknown;
}

async function main() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const cvAiParser = app.get(CvAiParserService);
  const skillStorageAdapter = app.get(SkillStorageAdapterService);
  const candidateProfileService = app.get(CandidateProfileService);
  const vectorSync = app.get(VectorSyncService);
  const documentStorageService = app.get(DocumentStorageService);
  const documentTextExtractorService = app.get(DocumentTextExtractorService);

  console.log('Fetching all uploaded CVs...');
  const cvs = await prisma.cV.findMany({
    where: {
      deletedAt: null,
      source: 'upload'
    },
    include: {
      candidate: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(`Found ${cvs.length} uploaded CVs in database.`);

  const pendingCvs = cvs.filter(cv => {
    const parsed = (cv.parsedData as any) || {};
    const parseStatus = parsed.parseStatus || '';
    return parseStatus === 'pending_apply' || !cv.candidateProfile;
  });

  console.log(`Of these, ${pendingCvs.length} CVs are pending parsing or have blank profiles.`);

  for (const cv of pendingCvs) {
    console.log(`\n--------------------------------------------`);
    console.log(`Processing CV ID: ${cv.id} | User: ${cv.candidate?.user?.email} | FileName: ${cv.fileName}`);
    
    try {
      // 1. Get raw text
      let rawText = cv.rawText;
      if (!rawText) {
        console.log('Raw text is missing in database. Extracting from file...');
        const absolutePath = documentStorageService.getAbsolutePath('cvs', cv.filePath);
        const buffer = await readFile(absolutePath);
        const extension = extname(cv.filePath).toLowerCase();
        const mimetype = extension === '.pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        const file = {
          buffer,
          mimetype,
          originalname: cv.filePath,
        } as Express.Multer.File;
        
        rawText = await documentTextExtractorService.extract(file, 'CV migration');
        rawText = rawText.slice(0, CV_MAX_TEXT_CHARS);
        
        // Save raw text back to DB as fallback
        await prisma.cV.update({
          where: { id: cv.id },
          data: { rawText }
        });
      }

      console.log(`Raw text length: ${rawText.length}. Calling AI parsing...`);
      const parsed = await cvAiParser.parse(rawText) as any;
      console.log('AI parsing completed. Updating database...');

      const normalizedSkills = skillStorageAdapter.toStoredSkills(
        parsed.skills || [],
        'cv_parsed',
      );

      // Helper to convert Prisma JSON to Record
      const asRecord = (val: unknown): Record<string, unknown> => {
        return val && typeof val === 'object' && !Array.isArray(val)
          ? (val as Record<string, unknown>)
          : {};
      };

      const normalizedProfile = asRecord(parsed.normalizedProfile);
      
      const candidateProfile = candidateProfileService.create({
        normalizedProfile: Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
        parsedData: parsed as Record<string, unknown>,
        skills: normalizedSkills.skills,
      });

      await prisma.cV.update({
        where: { id: cv.id },
        data: {
          parsedData: parsed as Prisma.InputJsonValue,
          skills: normalizedSkills.skills as Prisma.InputJsonValue,
          skillAtoms: normalizedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
          candidateProfile: candidateProfile as unknown as Prisma.InputJsonValue,
          candidateProfileVersion: candidateProfile?.version ?? null,
        },
      });

      console.log('Database updated successfully. Syncing vectors...');
      await vectorSync.syncCv(cv.id);
      console.log(`CV ${cv.id} successfully parsed and synchronized!`);
    } catch (err: any) {
      console.error(`Error processing CV ${cv.id}:`, err);
    }
  }

  console.log('\n--------------------------------------------');
  console.log('Migration completed.');
  await app.close();
}

main().catch(console.error);
