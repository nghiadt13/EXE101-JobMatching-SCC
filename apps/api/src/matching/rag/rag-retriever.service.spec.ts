import { Test, TestingModule } from '@nestjs/testing';
import { RagRetrieverService } from './rag-retriever.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClientService } from '../../normalization/gemini-client.service';

describe('RagRetrieverService', () => {
  let service: RagRetrieverService;
  let prisma: PrismaService;
  let gemini: GeminiClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagRetrieverService,
        {
          provide: PrismaService,
          useValue: {
            $queryRawUnsafe: jest.fn(),
          },
        },
        {
          provide: GeminiClientService,
          useValue: {
            generateEmbedding: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RagRetrieverService>(RagRetrieverService);
    prisma = module.get<PrismaService>(PrismaService);
    gemini = module.get<GeminiClientService>(GeminiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty when no query text is provided', async () => {
    const result = await service.retrieve({});
    expect(result.items).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should retrieve items using Hybrid Search', async () => {
    (gemini.generateEmbedding as jest.Mock).mockResolvedValue(new Array(768).fill(0.1));
    (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
      {
        id: '1',
        kind: 'related_skill',
        title: 'NestJS',
        content: 'Node.js framework',
        source: 'seed',
        tags: ['node'],
        rrf_score: 0.95,
      },
    ]);

    const result = await service.retrieve({ jdSkills: ['NestJS'] });
    
    expect(gemini.generateEmbedding).toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    expect(result.items.length).toBe(1);
    expect(result.items[0].item.title).toBe('NestJS');
    expect(result.items[0].score).toBe(0.95);
  });

  it('should handle errors gracefully and return warnings', async () => {
    (gemini.generateEmbedding as jest.Mock).mockRejectedValue(new Error('API Down'));

    const result = await service.retrieve({ jdSkills: ['NestJS'] });
    expect(result.items).toEqual([]);
    expect(result.warnings[0]).toContain('API Down');
  });
});
