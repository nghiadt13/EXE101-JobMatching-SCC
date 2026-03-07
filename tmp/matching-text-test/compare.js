const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const cvPath = path.join(__dirname, 'cv.txt');
const jdPath = path.join(__dirname, 'jd.txt');
const envPath = path.join(workspaceRoot, 'apps', 'api', '.env');
const reportPath = path.join(__dirname, 'last-run-summary.txt');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function normalizeKey(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeJsonParse(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse ${label} JSON: ${error.message}\n\nRaw output:\n${text}`);
  }
}

loadEnvFile(envPath);

const OpenAI = require(path.join(workspaceRoot, 'apps', 'api', 'node_modules', 'openai'));
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

function buildJdSchemaPrompt(jdText) {
  return [
    'You are building a recruiter-facing matching schema from one specific JD.',
    'Return only structured requirements that should affect candidate screening.',
    'Do not include company fluff, benefits, or generic narrative unless it creates a concrete requirement.',
    'Avoid duplicate or overlapping requirements unless one is explicitly a parent bucket with children.',
    'Return valid JSON only with this shape:',
    JSON.stringify(
      {
        jobTitle: 'string',
        requirements: [
          {
            id: 'req_docker',
            key: 'docker',
            label: 'Docker',
            category: 'containers',
            required: true,
            weight: 1,
            type: 'presence_or_experience',
            minExperienceMonths: null,
            acceptedAliases: ['docker'],
            children: [],
            minChildrenMatched: null,
            evidence: ['exact JD quote']
          }
        ]
      },
      null,
      2,
    ),
    'Rules:',
    '- key must be lowercase with underscores',
    '- type must be one of: presence, presence_or_experience, experience_min, bucket',
    '- use type=bucket only when a recruiter would judge a broader concept from several sub-skills',
    '- for bucket items, fill children with canonical child keys and set minChildrenMatched',
    '- for non-bucket items, children must be []',
    '- weight: 1 for core must-have, 0.6 for important, 0.3 for nice-to-have',
    '- minExperienceMonths must be null unless the JD clearly implies a concrete threshold',
    '- acceptedAliases should contain obvious equivalent terms only',
    '- cap the total number of requirements around 12 to 20',
    '- prefer atomic requirements plus a few justified buckets',
    '- do not include extra top-level metadata fields beyond jobTitle and requirements',
    'JD text starts below:',
    jdText,
  ].join('\n');
}

function buildCvEvaluationPrompt(jobSchema, cvText) {
  return [
    'You are evaluating a CV against a fixed recruiter-defined job schema.',
    'Do not invent new requirements. Only evaluate the requirement ids from the schema.',
    'Every evaluation must be evidence-backed from the CV text.',
    'If months of experience are not explicit, set experienceMonths to null and experienceSource to unknown or inferred.',
    'Return valid JSON only with this shape:',
    JSON.stringify(
      {
        evaluations: [
          {
            requirementId: 'req_docker',
            key: 'docker',
            matched: true,
            confidence: 0.85,
            experienceMonths: 12,
            experienceSource: 'explicit',
            aliasesMatched: ['docker'],
            childrenMatched: [],
            evidence: ['exact CV quote'],
            notes: 'short factual note'
          }
        ]
      },
      null,
      2,
    ),
    'Rules:',
    '- requirementId and key must come from the provided schema',
    '- matched must reflect whether the CV provides credible support for that requirement',
    '- confidence is 0 to 1 and should drop when evidence is weak or inferred',
    '- experienceSource must be one of: explicit, inferred, unknown',
    '- childrenMatched is only for bucket requirements',
    '- aliasesMatched should list alias terms from the schema that appear to match the CV evidence',
    '- do not add requirements that are not in the schema',
    '- do not include extra top-level metadata fields beyond evaluations',
    'Job schema starts below:',
    JSON.stringify(jobSchema, null, 2),
    'CV text starts below:',
    cvText,
  ].join('\n');
}

async function extractJson(client, prompt, label) {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Return strict JSON only. No markdown. No explanation outside JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`No ${label} content returned from OpenAI.`);
  }

  return safeJsonParse(content, label);
}

function normalizeRequirement(rawRequirement) {
  return {
    id: String(rawRequirement.id || '').trim() || `req_${normalizeKey(rawRequirement.key || rawRequirement.label)}`,
    key: normalizeKey(rawRequirement.key || rawRequirement.label),
    label: rawRequirement.label || rawRequirement.key || 'unknown',
    category: rawRequirement.category || 'general',
    required: rawRequirement.required !== false,
    weight: Number.isFinite(rawRequirement.weight)
      ? clamp(Number(rawRequirement.weight), 0.1, 1)
      : rawRequirement.required
        ? 1
        : 0.3,
    type: ['presence', 'presence_or_experience', 'experience_min', 'bucket'].includes(rawRequirement.type)
      ? rawRequirement.type
      : 'presence_or_experience',
    minExperienceMonths:
      Number.isFinite(rawRequirement.minExperienceMonths) && rawRequirement.minExperienceMonths >= 0
        ? Number(rawRequirement.minExperienceMonths)
        : null,
    acceptedAliases: Array.from(
      new Set(
        (Array.isArray(rawRequirement.acceptedAliases) ? rawRequirement.acceptedAliases : [])
          .map((item) => normalizeKey(item))
          .filter(Boolean),
      ),
    ),
    children: Array.from(
      new Set(
        (Array.isArray(rawRequirement.children) ? rawRequirement.children : [])
          .map((item) => normalizeKey(item))
          .filter(Boolean),
      ),
    ),
    minChildrenMatched:
      Number.isFinite(rawRequirement.minChildrenMatched) && rawRequirement.minChildrenMatched >= 0
        ? Number(rawRequirement.minChildrenMatched)
        : null,
    evidence: Array.isArray(rawRequirement.evidence) ? rawRequirement.evidence.filter(Boolean) : [],
  };
}

function normalizeEvaluation(rawEvaluation) {
  return {
    requirementId: String(rawEvaluation.requirementId || '').trim(),
    key: normalizeKey(rawEvaluation.key),
    matched: rawEvaluation.matched === true,
    confidence: clamp(Number(rawEvaluation.confidence) || 0, 0, 1),
    experienceMonths:
      Number.isFinite(rawEvaluation.experienceMonths) && rawEvaluation.experienceMonths >= 0
        ? Number(rawEvaluation.experienceMonths)
        : null,
    experienceSource: ['explicit', 'inferred', 'unknown'].includes(rawEvaluation.experienceSource)
      ? rawEvaluation.experienceSource
      : 'unknown',
    aliasesMatched: Array.isArray(rawEvaluation.aliasesMatched)
      ? rawEvaluation.aliasesMatched.map((item) => normalizeKey(item)).filter(Boolean)
      : [],
    childrenMatched: Array.isArray(rawEvaluation.childrenMatched)
      ? rawEvaluation.childrenMatched.map((item) => normalizeKey(item)).filter(Boolean)
      : [],
    evidence: Array.isArray(rawEvaluation.evidence) ? rawEvaluation.evidence.filter(Boolean) : [],
    notes: rawEvaluation.notes || '',
  };
}

function assessEvidenceStrength(evaluation) {
  const haystack = [
    ...(Array.isArray(evaluation?.evidence) ? evaluation.evidence : []),
    evaluation?.notes || '',
  ]
    .join(' ')
    .toLowerCase();

  const productionSignals = [
    'production',
    'deployed',
    'deployment environments',
    'maintenance',
    'troubleshoot',
    'managed',
    'support',
    'optimized',
    'responsible',
    'implemented',
    'developed',
  ];
  const handsOnSignals = [
    'hands-on',
    'built',
    'containerized',
    'integrated',
    'project',
    'internship',
    'experience',
    'using',
    'used',
  ];
  const conceptualSignals = [
    'concept',
    'conceptual',
    'basic',
    'fundamental',
    'fundamentals',
    'awareness',
    'familiarity',
    'familiar',
    'exposure',
    'understanding',
    'knowledge',
  ];

  if (productionSignals.some((token) => haystack.includes(token))) {
    return 1;
  }
  if (handsOnSignals.some((token) => haystack.includes(token))) {
    return 0.78;
  }
  if (conceptualSignals.some((token) => haystack.includes(token))) {
    return 0.45;
  }
  return 0.6;
}

function scoreRequirement(requirement, evaluation) {
  if (!evaluation || evaluation.matched !== true) {
    return {
      status: 'missing',
      contribution: 0,
      normalizedContribution: 0,
      componentScores: {
        presence: 0,
        experience: 0,
        confidence: 0,
      },
    };
  }

  const presenceScore = 1;
  const evidenceStrength = assessEvidenceStrength(evaluation);
  let experienceScore = 0.4;

  if (requirement.type === 'bucket') {
    const requiredChildren = requirement.minChildrenMatched ?? Math.min(1, requirement.children.length);
    const childCoverage = requiredChildren <= 0
      ? 1
      : clamp(evaluation.childrenMatched.length / requiredChildren, 0, 1);
    experienceScore = Math.min(childCoverage, evidenceStrength);
    if (evaluation.experienceSource === 'unknown') {
      experienceScore = Math.min(experienceScore, 0.65);
    }
  } else if (requirement.minExperienceMonths == null) {
    if (evaluation.experienceMonths != null) {
      experienceScore = 0.75 + 0.25 * evidenceStrength;
    } else if (evaluation.experienceSource === 'explicit') {
      experienceScore = evidenceStrength;
    } else if (evaluation.experienceSource === 'inferred') {
      experienceScore = Math.min(evidenceStrength, 0.55);
    } else {
      experienceScore = Math.min(evidenceStrength, 0.45);
    }
  } else if (evaluation.experienceMonths == null) {
    experienceScore = evaluation.experienceSource === 'inferred' ? 0.35 : 0.2;
  } else {
    experienceScore = clamp(evaluation.experienceMonths / Math.max(requirement.minExperienceMonths, 1), 0, 1);
    if (evaluation.experienceSource === 'inferred') {
      experienceScore = Math.min(experienceScore, 0.6);
    }
    experienceScore = Math.min(experienceScore, 0.4 + evidenceStrength * 0.6);
  }

  const confidenceScore = clamp(evaluation.confidence || 0, 0, 1);
  const contribution =
    (presenceScore * 0.3 + experienceScore * 0.5 + confidenceScore * 0.2) * requirement.weight;

  return {
    status:
      contribution >= requirement.weight * 0.85
        ? 'strong'
        : contribution >= requirement.weight * 0.55
          ? 'partial'
          : 'weak',
    contribution,
    normalizedContribution: requirement.weight === 0 ? 0 : contribution / requirement.weight,
    componentScores: {
      presence: presenceScore,
      experience: experienceScore,
      confidence: confidenceScore,
      evidenceStrength,
    },
  };
}

function compareSchemaAgainstEvaluation(jobSchema, cvEvaluation) {
  const requirements = Array.isArray(jobSchema.requirements)
    ? jobSchema.requirements.map(normalizeRequirement)
    : [];
  const evaluations = Array.isArray(cvEvaluation.evaluations)
    ? cvEvaluation.evaluations.map(normalizeEvaluation)
    : [];

  const evaluationMap = new Map();
  for (const evaluation of evaluations) {
    if (evaluation.requirementId) {
      evaluationMap.set(evaluation.requirementId, evaluation);
    }
  }

  const results = [];
  let totalWeight = 0;
  let totalContribution = 0;

  for (const requirement of requirements) {
    const evaluation = evaluationMap.get(requirement.id) || null;
    const scored = scoreRequirement(requirement, evaluation);
    totalWeight += requirement.weight;
    totalContribution += scored.contribution;

    results.push({
      requirement,
      evaluation,
      ...scored,
    });
  }

  return {
    finalScore: totalWeight === 0 ? 0 : totalContribution / totalWeight,
    results,
    strong: results.filter((item) => item.status === 'strong'),
    partial: results.filter((item) => item.status === 'partial' || item.status === 'weak'),
    missing: results.filter((item) => item.status === 'missing'),
  };
}

function buildTextReport(jobSchema, cvEvaluation, comparison) {
  const lines = [
    `Model: ${MODEL}`,
    `Job title: ${jobSchema.jobTitle || 'n/a'}`,
    '',
    '=== MATCH RESULT ===',
    `Final deterministic score: ${comparison.finalScore.toFixed(4)}`,
    `Final percent: ${Math.round(comparison.finalScore * 100)}%`,
    `Strong matches: ${comparison.strong.length}`,
    `Partial matches: ${comparison.partial.length}`,
    `Missing matches: ${comparison.missing.length}`,
    '',
    '=== REQUIREMENT BREAKDOWN ===',
  ];

  for (const item of comparison.results) {
    lines.push(
      `${item.requirement.label} | status=${item.status} | score=${item.normalizedContribution.toFixed(4)}`,
    );
  }

  return lines.join('\n');
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(`OPENAI_API_KEY is missing. Checked current env and ${envPath}.`);
  }

  const cvText = fs.readFileSync(cvPath, 'utf8');
  const jdText = fs.readFileSync(jdPath, 'utf8');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log(`Model: ${MODEL}`);
  console.log('Step 1: sending JD to OpenAI to build a job schema...');
  const jobSchema = await extractJson(client, buildJdSchemaPrompt(jdText), 'job schema');

  console.log('Step 2: sending job schema + CV to OpenAI for requirement-by-requirement evaluation...');
  const cvEvaluation = await extractJson(
    client,
    buildCvEvaluationPrompt(jobSchema, cvText),
    'CV evaluation',
  );

  const comparison = compareSchemaAgainstEvaluation(jobSchema, cvEvaluation);
  const textReport = buildTextReport(jobSchema, cvEvaluation, comparison);
  fs.writeFileSync(reportPath, textReport, 'utf8');

  console.log('\n=== MATCH RESULT ===');
  console.log('Final deterministic score:', comparison.finalScore.toFixed(4));
  console.log('Final percent:', Math.round(comparison.finalScore * 100) + '%');
  console.log('Strong matches:', comparison.strong.length);
  console.log('Partial matches:', comparison.partial.length);
  console.log('Missing matches:', comparison.missing.length);
  console.log('Saved summary:', reportPath);

  console.log('\n=== REQUIREMENT BREAKDOWN ===');
  for (const item of comparison.results) {
    console.log(`${item.requirement.label} | status=${item.status} | score=${item.normalizedContribution.toFixed(4)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});