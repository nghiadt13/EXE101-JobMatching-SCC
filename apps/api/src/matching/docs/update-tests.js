const fs = require('fs');
const file = 'f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/matching.service.spec.ts';
let code = fs.readFileSync(file, 'utf8');

const oldV2Test = `  it('uses schema_v2 evaluation with stored CV raw text and avoids file fallback', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({ rawText: 'raw cv with TypeScript and NestJS' }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ requirementsSchema: requirementsSchemaV2() }),
    );

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('schema_v2');
    expect(result.score).toBe(82);
    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith({
      cvRawText: 'raw cv with TypeScript and NestJS',
      requirementsSchema: requirementsSchemaV2(),
    });
    expect(mockedReadFile).not.toHaveBeenCalled();
    expect(documentTextExtractorService.extract).not.toHaveBeenCalled();
  });`;

const newV2Tests = `  it('uses schema_v2 evaluation, calls retriever with correct input, and passes formatted RAG context', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({ rawText: 'raw cv with TypeScript and NestJS', skills: ['TypeScript'] }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ 
        title: 'Backend Engineer',
        description: 'Need NestJS',
        skills: ['NestJS'],
        requirementsSchema: requirementsSchemaV2() 
      }),
    );
    ragRetrieverService.retrieve.mockReturnValue({
      items: [
        { item: { kind: 'related_skill', title: 'NestJS', content: 'Node.js framework', source: 'seed' }, reason: 'match' }
      ]
    });

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('schema_v2');
    expect(ragRetrieverService.retrieve).toHaveBeenCalledWith({
      jdSkills: ['NestJS', 'TypeScript', 'typescript'], // 'TypeScript' is label, 'typescript' is keyword from requirementsSchemaV2()
      cvSkills: ['TypeScript'],
      jdText: 'Backend Engineer\\nNeed NestJS',
      cvText: 'raw cv with TypeScript and NestJS',
    });
    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith({
      cvRawText: 'raw cv with TypeScript and NestJS',
      requirementsSchema: requirementsSchemaV2(),
      ragContext: '- [related_skill] NestJS: Node.js framework. Source: seed. Reason: match',
    });
  });

  it('works when schema_v2 retriever returns no items', async () => {
    prismaService.cV.findFirst.mockResolvedValue(cvRecord({ rawText: 'cv' }));
    prismaService.job.findFirst.mockResolvedValue(jobRecord({ requirementsSchema: requirementsSchemaV2() }));
    ragRetrieverService.retrieve.mockReturnValue({ items: [] });

    await service.calculateForCvAndJob('cv-1', 'job-1', { sub: 'candidate-1', role: UserRole.CANDIDATE });

    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith({
      cvRawText: 'cv',
      requirementsSchema: requirementsSchemaV2(),
      ragContext: undefined,
    });
  });

  it('works when schema_v2 retriever throws an error', async () => {
    prismaService.cV.findFirst.mockResolvedValue(cvRecord({ rawText: 'cv' }));
    prismaService.job.findFirst.mockResolvedValue(jobRecord({ requirementsSchema: requirementsSchemaV2() }));
    ragRetrieverService.retrieve.mockImplementation(() => { throw new Error('RAG failure'); });

    await service.calculateForCvAndJob('cv-1', 'job-1', { sub: 'candidate-1', role: UserRole.CANDIDATE });

    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith({
      cvRawText: 'cv',
      requirementsSchema: requirementsSchemaV2(),
      ragContext: undefined,
    });
  });`;

code = code.replace(oldV2Test, newV2Tests);
fs.writeFileSync(file, code);
