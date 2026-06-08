import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Slugify function to generate clean slugs from company names
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

async function main() {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://postgres:namngo001@localhost:5432/job_matching';

  console.log(`Connecting to database...`);
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    // 1. Read JSON file
    const jsonPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'topcv_companies_logo_only.json'
    );
    console.log(`Reading JSON from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File topcv_companies_logo_only.json not found at ${jsonPath}`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const rawCompanies: Array<{ company_name: string; company_logo: string }> =
      JSON.parse(fileContent);

    console.log(`Found ${rawCompanies.length} companies in JSON file.`);

    // 2. Upsert Companies in database
    const createdCompanies: any[] = [];
    for (const rawComp of rawCompanies) {
      const slug = slugify(rawComp.company_name);
      console.log(`Upserting company: ${rawComp.company_name} (slug: ${slug})`);
      
      const company = await prisma.company.upsert({
        where: { slug },
        update: {
          name: rawComp.company_name,
          logoUrl: rawComp.company_logo,
        },
        create: {
          name: rawComp.company_name,
          slug,
          logoUrl: rawComp.company_logo,
          isTrusted: true,
          companyType: 'normal',
        },
      });
      createdCompanies.push(company);
    }

    console.log(`Successfully upserted ${createdCompanies.length} companies in DB.`);

    // 3. Fetch all Jobs
    const jobs = await prisma.job.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, companyId: true },
    });

    console.log(`Found ${jobs.length} jobs in database.`);

    if (jobs.length === 0) {
      console.log('No jobs to update.');
      return;
    }

    // 4. Assign companies to jobs round-robin style
    let updatedCount = 0;
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const targetCompany = createdCompanies[i % createdCompanies.length];
      
      console.log(
        `Assigning job "${job.title}" to company "${targetCompany.name}"`
      );
      
      await prisma.job.update({
        where: { id: job.id },
        data: {
          companyId: targetCompany.id,
        },
      });
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} jobs with company details!`);
  } catch (error) {
    console.error(`Error executing script:`, error);
  } finally {
    console.log('Closing connections...');
    await prisma.$disconnect();
    await pool.end();
    console.log('Connections closed.');
  }
}

main();
