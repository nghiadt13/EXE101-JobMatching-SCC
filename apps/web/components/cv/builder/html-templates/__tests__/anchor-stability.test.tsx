import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

import type { CvBuilderData } from '@/types/cv-builder';

import { SimpleTemplate } from '../simple-template';
import { ProfessionalTemplate } from '../professional-template';
import { ModernTemplate } from '../modern-template';

/**
 * Property 9: SectionNav Anchor Stability
 * Validates: Requirements 3.3
 *
 * `SectionNav` scrolls the canvas to `#cv-section-${sectionId}` for each of
 * the seven canonical section ids. Two or more elements sharing the same id
 * would make the scroll target ambiguous and could break smooth-scroll
 * behaviour. This property guarantees that for arbitrary `CvBuilderData`,
 * each template produces AT MOST ONE element with `id="cv-section-${id}"`
 * for every `id` in the canonical section list.
 *
 * The test runs the same property against all three templates (Simple,
 * Professional, Modern) so a regression in any one of them is caught
 * locally rather than only via a full canvas integration test.
 */

const SECTIONS = [
  'profile',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
] as const;

const TEMPLATES = [
  { id: 'simple', Component: SimpleTemplate },
  { id: 'professional', Component: ProfessionalTemplate },
  { id: 'modern', Component: ModernTemplate },
] as const;

/**
 * Smart `CvBuilderData` generator. We stay close to the real shape so the
 * templates exercise the same code paths they would in production:
 *
 * - Required fields (`role`, `company`, `startDate`, `school`, `degree`,
 *   `name`) get arbitrary strings.
 * - Optional fields are omitted at the type level — including them adds no
 *   new branches relevant to the anchor-stability property.
 * - Repeating arrays are bounded to keep render cost reasonable across the
 *   25 fast-check runs per template.
 */
const cvDataArb: fc.Arbitrary<CvBuilderData> = fc.record({
  templateId: fc.constantFrom('simple', 'professional', 'modern'),
  profile: fc.record({ name: fc.string() }),
  experience: fc.array(
    fc.record({
      role: fc.string(),
      company: fc.string(),
      startDate: fc.string(),
    }),
    { maxLength: 3 },
  ),
  education: fc.array(
    fc.record({
      school: fc.string(),
      degree: fc.string(),
    }),
    { maxLength: 3 },
  ),
  skills: fc.array(fc.string(), { maxLength: 5 }),
  projects: fc.array(fc.record({ name: fc.string() }), { maxLength: 3 }),
  certifications: fc.array(fc.string(), { maxLength: 3 }),
  languages: fc.array(fc.string(), { maxLength: 3 }),
}) as fc.Arbitrary<CvBuilderData>;

describe.each(TEMPLATES)(
  'Property 9: $id template anchor stability',
  ({ Component }) => {
    it('renders at most one element per section anchor id', () => {
      fc.assert(
        fc.property(cvDataArb, (data) => {
          const { container, unmount } = render(
            <Component data={data} onChange={() => {}} />,
          );
          try {
            for (const section of SECTIONS) {
              const matches = container.querySelectorAll(
                `[id="cv-section-${section}"]`,
              );
              expect(matches.length).toBeLessThanOrEqual(1);
            }
          } finally {
            // Always unmount to release the DOM between runs even when an
            // assertion fails, so subsequent shrink iterations start clean.
            unmount();
          }
        }),
        { numRuns: 25 },
      );
    });
  },
);
