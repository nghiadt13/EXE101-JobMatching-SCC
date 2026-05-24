import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import {
  type CvBuilderData,
  DEFAULT_DESIGN_TOKENS,
} from '@/types/cv-builder';

import { SimpleTemplate } from '../simple-template';
import { ProfessionalTemplate } from '../professional-template';
import { ModernTemplate } from '../modern-template';

/**
 * Unit tests for the three HTML templates.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.6
 *
 * Each template is rendered with a representative `CvBuilderData` populated
 * with at least one entry per repeating section so the corresponding
 * `BlockOverlay` wrappers also render. We then assert:
 *
 * 1. **Section anchors present** — `id="cv-section-profile"` is in the DOM.
 *    All templates ship the seven canonical anchors; checking the profile
 *    anchor on its own is enough as a smoke test (the anchor-stability
 *    property test covers uniqueness across all seven).
 * 2. **Accent uses CSS variable** — at least one element ships the
 *    `text-[var(--cv-primary-color)]` Tailwind arbitrary-value class so the
 *    accent color stays driven by the `--cv-primary-color` CSS variable
 *    (Requirements 8.1, 8.2, 8.6).
 * 3. **Modern pill backgrounds use 8-digit hex** — when `ModernTemplate`
 *    renders with `primaryColor: '#1e40af'`, at least one element has a
 *    `style.backgroundColor` matching `#1e40afXX` (8-digit hex). This
 *    validates the `withAlpha` interpolation that backs the rounded pill
 *    section headers (Requirement 8.3).
 */

/**
 * Sample CV data shared by Simple and Professional templates. At least one
 * entry per repeating section guarantees that:
 *  - `BlockOverlay` wrappers render around real DOM nodes,
 *  - empty-state placeholders are bypassed,
 *  - accent-color text spans (e.g. company name) are present in the tree.
 */
const SAMPLE_DATA: CvBuilderData = {
  templateId: 'simple',
  profile: {
    name: 'Nguyễn Văn A',
    email: 'a@example.com',
    phone: '0909123456',
    website: 'linkedin.com/in/example',
    summary: 'Frontend developer with 3 years of experience.',
    location: { city: 'Hồ Chí Minh', country: 'Việt Nam' },
  },
  experience: [
    {
      role: 'Frontend Developer',
      company: 'Acme Corp',
      startDate: '01/2022',
      endDate: '12/2024',
      description: 'Built design system in React.',
    },
  ],
  education: [
    {
      school: 'Đại học Bách Khoa',
      degree: 'Cử nhân',
      field: 'Khoa học máy tính',
      startDate: '09/2018',
      endDate: '06/2022',
    },
  ],
  skills: ['React', 'TypeScript', 'Tailwind'],
  projects: [
    {
      name: 'Job Matching MVP',
      description: 'Job board with AI matching.',
    },
  ],
  certifications: ['AWS Certified Developer'],
  languages: ['Tiếng Việt', 'English'],
};

/** CSS variable accent class used across all three templates. */
const ACCENT_CLASS = 'text-[var(--cv-primary-color)]';

describe('SimpleTemplate', () => {
  it('renders the profile section anchor', () => {
    const { container } = render(
      <SimpleTemplate data={SAMPLE_DATA} onChange={() => {}} />,
    );
    expect(container.querySelector('#cv-section-profile')).not.toBeNull();
  });

  it('uses the --cv-primary-color CSS variable for accents', () => {
    const { container } = render(
      <SimpleTemplate data={SAMPLE_DATA} onChange={() => {}} />,
    );
    const accented = container.querySelectorAll(`.${CSS.escape(ACCENT_CLASS)}`);
    expect(accented.length).toBeGreaterThan(0);
  });
});

describe('ProfessionalTemplate', () => {
  it('renders the profile section anchor', () => {
    const { container } = render(
      <ProfessionalTemplate
        data={{ ...SAMPLE_DATA, templateId: 'professional' }}
        onChange={() => {}}
      />,
    );
    expect(container.querySelector('#cv-section-profile')).not.toBeNull();
  });

  it('uses the --cv-primary-color CSS variable for accents', () => {
    const { container } = render(
      <ProfessionalTemplate
        data={{ ...SAMPLE_DATA, templateId: 'professional' }}
        onChange={() => {}}
      />,
    );
    const accented = container.querySelectorAll(`.${CSS.escape(ACCENT_CLASS)}`);
    expect(accented.length).toBeGreaterThan(0);
  });
});

describe('ModernTemplate', () => {
  /**
   * `ModernTemplate` is the only template that uses `withAlpha` to compute
   * pill background colours. Pin the primary colour to `#1e40af` so the
   * 8-digit hex assertion has a deterministic prefix to match.
   */
  const modernData: CvBuilderData = {
    ...SAMPLE_DATA,
    templateId: 'modern',
    designTokens: { ...DEFAULT_DESIGN_TOKENS, primaryColor: '#1e40af' },
  };

  it('renders the profile section anchor', () => {
    const { container } = render(
      <ModernTemplate data={modernData} onChange={() => {}} />,
    );
    expect(container.querySelector('#cv-section-profile')).not.toBeNull();
  });

  it('uses the --cv-primary-color CSS variable for accents', () => {
    const { container } = render(
      <ModernTemplate data={modernData} onChange={() => {}} />,
    );
    const accented = container.querySelectorAll(`.${CSS.escape(ACCENT_CLASS)}`);
    expect(accented.length).toBeGreaterThan(0);
  });

  it('paints pill backgrounds with an 8-digit hex derived from the primary color', () => {
    const { container } = render(
      <ModernTemplate data={modernData} onChange={() => {}} />,
    );

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>('[style*="background-color"]'),
    );

    // `withAlpha('#1e40af')` returns `'#1e40af1a'` — an 8-digit hex with an
    // alpha channel of `0x1a` (~10%). When this string is assigned to
    // `el.style.backgroundColor`, the DOM CSSOM parses it. jsdom normalises
    // the value into `rgba(30, 64, 175, 0.1)` (decimal channels), while the
    // raw `style` attribute can still contain the literal `#1e40af1a`
    // depending on how React sets it. Accept both forms — they are
    // semantically equivalent and prove the alpha channel from
    // `withAlpha` made it into the rendered output (Requirement 8.3).
    const eightDigitHex = /#1e40af[0-9a-f]{2}/i;
    const rgbaWithAlpha =
      /rgba?\(\s*30\s*,\s*64\s*,\s*175\s*,\s*0?\.\d+\s*\)/i;

    const matched = elements.some((el) => {
      const inline = el.style.backgroundColor;
      const raw = el.getAttribute('style') ?? '';
      return (
        eightDigitHex.test(inline) ||
        eightDigitHex.test(raw) ||
        rgbaWithAlpha.test(inline) ||
        rgbaWithAlpha.test(raw)
      );
    });

    expect(matched).toBe(true);
  });
});
