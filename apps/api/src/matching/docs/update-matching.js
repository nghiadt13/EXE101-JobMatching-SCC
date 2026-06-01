const fs = require('fs');
const file = 'f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/matching.service.ts';
let code = fs.readFileSync(file, 'utf8');

const oldCode = `      const ragContextResult = this.ragRetrieverService.retrieve({
        jdText: job.description,
        cvText: cvRawText,
      });
      
      const ragContextStr = ragContextResult.items.length > 0
        ? ragContextResult.items.map((i) => \`- \${i.item.title}: \${i.item.content}\`).join('\\n')
        : undefined;`;

const newCode = `      let ragContextStr: string | undefined = undefined;
      try {
        const jdSkills = Array.isArray(job.skills)
          ? job.skills.map(String)
          : [];
        
        const reqSchema = requirementsSchema as RequirementsSchemaV2;
        const reqLabelsAndKeywords = reqSchema.requirements.flatMap(r => [r.label, ...(r.keywords || [])]);
        
        const cvSkills = Array.isArray(cv.skills)
          ? cv.skills.map(String)
          : [];
          
        const jdText = [job.title, job.description].filter(Boolean).join('\\n');

        const ragContextResult = this.ragRetrieverService.retrieve({
          jdSkills: [...jdSkills, ...reqLabelsAndKeywords],
          cvSkills,
          jdText,
          cvText: cvRawText,
        });

        if (ragContextResult.items.length > 0) {
          ragContextStr = ragContextResult.items
            .map((i) => \`- [\${i.item.kind}] \${i.item.title}: \${i.item.content}. Source: \${i.item.source}. Reason: \${i.reason}\`)
            .join('\\n');
        }
      } catch (error) {
        // Fallback: continue matching without RAG
      }`;

code = code.replace(oldCode, newCode);

fs.writeFileSync(file, code);
