import { Injectable } from '@nestjs/common';

const FULL_LABEL_ALIASES = new Map<string, string>([
  ['amazon web services', 'aws'],
  ['aws', 'aws'],
  ['g cloud', 'gcp'],
  ['google cloud', 'gcp'],
  ['google cloud platform', 'gcp'],
  ['microsoft azure', 'azure'],
  ['next js', 'nextjs'],
  ['next.js', 'nextjs'],
  ['node', 'nodejs'],
  ['node js', 'nodejs'],
  ['node.js', 'nodejs'],
  ['react js', 'react'],
  ['react.js', 'react'],
  ['reactjs', 'react'],
  ['nest js', 'nestjs'],
  ['nest.js', 'nestjs'],
  ['postgres', 'postgresql'],
  ['postgres sql', 'postgresql'],
  ['ts', 'typescript'],
  ['js', 'javascript'],
  ['ci cd', 'ci/cd'],
]);

@Injectable()
export class SkillCanonicalizerService {
  canonicalize(label: string): string {
    const cleaned = this.normalizeWhitespace(label)
      .toLowerCase()
      .replace(/c\+\+/g, 'cpp')
      .replace(/c#/g, 'csharp')
      .replace(/\.net/g, 'dotnet')
      .replace(/[()[\]{}]/g, ' ')
      .replace(/[,:;|]/g, ' ')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return '';
    }

    const normalizedDots = cleaned.replace(/\./g, ' ');
    const alias = FULL_LABEL_ALIASES.get(normalizedDots);
    if (alias) {
      return alias;
    }

    return normalizedDots.replace(/\s+/g, ' ').trim();
  }

  normalizeLabel(label: string): string {
    return this.normalizeWhitespace(label)
      .replace(/^[-•*\u2022]+/u, '')
      .trim();
  }

  private normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
