import { RagKnowledgeItem } from './rag.types';

export const RAG_KNOWLEDGE_BASE: RagKnowledgeItem[] = [
  alias('skill-alias-react', 'React', ['react', 'reactjs', 'react.js', 'react js']),
  alias('skill-alias-node', 'Node.js', ['node', 'nodejs', 'node.js', 'node js']),
  alias('skill-alias-postgresql', 'PostgreSQL', [
    'postgres',
    'postgresql',
    'postgres sql',
  ]),
  alias('skill-alias-typescript', 'TypeScript', ['typescript', 'ts']),
  alias('skill-alias-javascript', 'JavaScript', ['javascript', 'js']),
  alias('skill-alias-next', 'Next.js', ['nextjs', 'next.js', 'next js']),
  alias('skill-alias-nest', 'NestJS', ['nestjs', 'nest.js', 'nest js']),
  alias('skill-alias-aws', 'AWS', [
    'aws',
    'amazon web services',
    'amazon cloud',
  ]),
  alias('skill-alias-gcp', 'GCP', [
    'gcp',
    'google cloud',
    'google cloud platform',
  ]),
  alias('skill-alias-azure', 'Azure', ['azure', 'microsoft azure']),
  alias('skill-alias-k8s', 'Kubernetes', ['kubernetes', 'k8s']),
  alias('skill-alias-docker', 'Docker', ['docker', 'container']),
  alias('skill-alias-ci-cd', 'CI/CD', ['ci/cd', 'cicd', 'ci cd']),
  alias('skill-alias-dotnet', '.NET', ['.net', 'dotnet', 'asp.net']),
  alias('skill-alias-csharp', 'C#', ['c#', 'csharp']),
  alias('skill-alias-cpp', 'C++', ['c++', 'cpp']),
  alias('skill-alias-python', 'Python', ['python', 'py']),
  alias('skill-alias-django', 'Django', ['django', 'python django']),
  alias('skill-alias-spring', 'Spring Boot', ['spring boot', 'springboot']),
  alias('skill-alias-vue', 'Vue', ['vue', 'vuejs', 'vue.js']),
  alias('skill-alias-tailwind', 'Tailwind CSS', ['tailwind', 'tailwindcss']),
  alias('skill-alias-mongodb', 'MongoDB', ['mongodb', 'mongo']),
  alias('skill-alias-mysql', 'MySQL', ['mysql', 'my sql']),
  alias('skill-alias-redis', 'Redis', ['redis']),
  alias('skill-alias-prisma', 'Prisma', ['prisma', 'prisma orm']),
  alias('skill-alias-graphql', 'GraphQL', ['graphql', 'graph ql']),
  alias('skill-alias-rest', 'REST API', ['rest', 'rest api', 'restful']),
  alias('skill-alias-ml', 'Machine Learning', ['machine learning', 'ml']),
  alias('skill-alias-pytorch', 'PyTorch', ['pytorch', 'torch']),
  alias('skill-alias-tensorflow', 'TensorFlow', ['tensorflow', 'tf']),

  related('related-nest-node', 'NestJS and Node.js', [
    'nestjs',
    'nodejs',
    'node.js',
    'backend',
  ]),
  related('related-next-react', 'Next.js and React', [
    'nextjs',
    'next.js',
    'react',
    'frontend',
  ]),
  related('related-prisma-orm', 'Prisma and ORM', [
    'prisma',
    'orm',
    'database',
    'postgresql',
  ]),
  related('related-django-python', 'Django and Python', [
    'django',
    'python',
    'backend',
  ]),
  related('related-spring-java', 'Spring Boot and Java', [
    'spring boot',
    'springboot',
    'java',
    'backend',
  ]),
  related('related-docker-k8s', 'Docker and Kubernetes', [
    'docker',
    'kubernetes',
    'k8s',
    'container',
  ]),
  related('related-react-ts', 'React and TypeScript', [
    'react',
    'typescript',
    'frontend',
  ]),
  related('related-node-postgres', 'Node.js and PostgreSQL', [
    'nodejs',
    'postgresql',
    'backend',
  ]),
  related('related-aws-cloud', 'AWS and Cloud Infrastructure', [
    'aws',
    'cloud',
    'infrastructure',
  ]),
  related('related-redis-cache', 'Redis and Caching', [
    'redis',
    'cache',
    'performance',
  ]),
  related('related-graphql-api', 'GraphQL and API Design', [
    'graphql',
    'api',
    'backend',
  ]),
  related('related-pytorch-ml', 'PyTorch and Machine Learning', [
    'pytorch',
    'machine learning',
    'ml',
  ]),

  group('skill-group-frontend', 'Frontend skill group', [
    'frontend',
    'react',
    'nextjs',
    'vue',
    'typescript',
    'tailwind',
  ]),
  group('skill-group-backend', 'Backend skill group', [
    'backend',
    'nodejs',
    'nestjs',
    'java',
    'spring boot',
    'django',
  ]),
  group('skill-group-cloud', 'Cloud skill group', [
    'cloud',
    'aws',
    'gcp',
    'azure',
    'kubernetes',
    'docker',
  ]),
  group('skill-group-database', 'Database skill group', [
    'database',
    'postgresql',
    'mysql',
    'mongodb',
    'redis',
  ]),
  group('skill-group-data-ai', 'Data and AI skill group', [
    'data',
    'machine learning',
    'python',
    'pytorch',
    'tensorflow',
  ]),
  group('skill-group-mobile', 'Mobile skill group', [
    'mobile',
    'ios',
    'android',
    'react native',
    'flutter',
  ]),

  role('role-intern', 'Intern engineer expectations', [
    'intern',
    'internship',
    'entry level',
    'learning',
  ]),
  role('role-junior', 'Junior engineer expectations', [
    'junior',
    '0-1 year',
    '1 year',
    'basic',
  ]),
  role('role-mid', 'Mid-level engineer expectations', [
    'mid',
    '2 years',
    '3 years',
    'independent',
  ]),
  role('role-senior', 'Senior engineer expectations', [
    'senior',
    '5 years',
    'architecture',
    'mentor',
    'lead',
  ]),
  role('role-lead', 'Tech lead expectations', [
    'tech lead',
    'lead engineer',
    'roadmap',
    'ownership',
  ]),
  role('role-manager', 'Engineering manager expectations', [
    'manager',
    'people management',
    'hiring',
    'delivery',
  ]),

  domain('domain-aws-cert', 'AWS certification', [
    'aws certification',
    'aws certified',
    'solution architect',
    'cloud certification',
  ]),
  domain('domain-azure-cert', 'Azure certification', [
    'azure certification',
    'azure certified',
  ]),
  domain('domain-language-japanese', 'Japanese language requirement', [
    'japanese',
    'n2',
    'jlpt',
  ]),
  domain('domain-language-english', 'English communication requirement', [
    'english',
    'ielts',
    'toeic',
  ]),
  domain('domain-healthcare', 'Healthcare domain', [
    'healthcare',
    'hospital',
    'patient',
    'medical',
    'clinical',
  ]),
  domain('domain-finance', 'Finance domain', [
    'finance',
    'banking',
    'payment',
    'fintech',
  ]),
  domain('domain-logistics', 'Logistics domain', [
    'logistics',
    'supply chain',
    'shipment',
    'warehouse',
  ]),
  domain('domain-security', 'Security domain', [
    'security',
    'owasp',
    'vulnerability',
    'compliance',
  ]),
];

function alias(id: string, title: string, tags: string[]): RagKnowledgeItem {
  return {
    id,
    kind: 'skill_alias',
    title,
    content: `${title} aliases and spelling variants.`,
    tags,
    source: 'seed:skill-aliases',
  };
}

function related(id: string, title: string, tags: string[]): RagKnowledgeItem {
  return {
    id,
    kind: 'related_skill',
    title,
    content: `${title} are commonly related in job descriptions, but still need CV evidence.`,
    tags,
    source: 'seed:related-skills',
  };
}

function group(id: string, title: string, tags: string[]): RagKnowledgeItem {
  return {
    id,
    kind: 'skill_group',
    title,
    content: `${title} groups skills for broad retrieval context.`,
    tags,
    source: 'seed:skill-groups',
  };
}

function role(id: string, title: string, tags: string[]): RagKnowledgeItem {
  return {
    id,
    kind: 'role_expectation',
    title,
    content: `${title} describe expected responsibility level, not candidate evidence.`,
    tags,
    source: 'seed:role-expectations',
  };
}

function domain(id: string, title: string, tags: string[]): RagKnowledgeItem {
  return {
    id,
    kind: 'domain_hint',
    title,
    content: `${title} helps interpret domain or constraint language.`,
    tags,
    source: 'seed:domain-hints',
  };
}
