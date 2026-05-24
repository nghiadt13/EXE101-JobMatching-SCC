import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { reorderSection, deleteSectionItem } from '../section-helpers';
import type { CvBuilderData } from '@/types/cv-builder';

const baseCv: CvBuilderData = {
  templateId: 'simple',
  profile: { name: 'X' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

const skillsArb = fc.array(fc.string(), { minLength: 2, maxLength: 8 });

describe('section-helpers (property tests)', () => {
  /**
   * Property 1: Reorder Idempotence Across Reverse Direction
   * Validates: Requirements 2.3, 2.4
   *
   * For any valid index, moving an item up and then moving the previous
   * neighbour down (i.e., applying the inverse swap) restores the original
   * array contents. Equivalent to involution under valid moves.
   */
  it('Property 1: reorder idempotence across reverse direction', () => {
    fc.assert(
      fc.property(skillsArb, (skills) => {
        const data = { ...baseCv, skills };
        for (let i = 0; i < skills.length - 1; i++) {
          // up at i+1 swaps positions i and i+1; down at i swaps them back.
          const a = reorderSection(data, 'skills', i + 1, 'up');
          const b = reorderSection(a, 'skills', i, 'down');
          expect(b.skills).toEqual(skills);
        }
      }),
    );
  });

  /**
   * Property 2: Reorder Length Preservation
   * Validates: Requirements 2.3, 2.4, 2.5
   *
   * For any (direction, index), including out-of-bounds indices, the
   * resulting section array length equals the input array length.
   */
  it('Property 2: reorder length preservation', () => {
    fc.assert(
      fc.property(
        skillsArb,
        fc.integer({ min: -5, max: 20 }),
        fc.constantFrom('up', 'down'),
        (skills, idx, dir) => {
          const data = { ...baseCv, skills };
          const result = reorderSection(data, 'skills', idx, dir as 'up' | 'down');
          expect(result.skills.length).toBe(skills.length);
        },
      ),
    );
  });

  /**
   * Property 3: Delete Length Decrement
   * Validates: Requirements 2.7
   *
   * For any valid index in a non-empty array:
   *   - the resulting array length is reduced by exactly one
   *   - relative order of remaining items is preserved
   *   - the item at position `idx` after deletion equals the item that
   *     was previously at `idx + 1` (when one exists)
   */
  it('Property 3: delete length decrement and item absence', () => {
    fc.assert(
      fc.property(skillsArb, fc.integer({ min: 0, max: 100 }), (skills, rawIdx) => {
        const idx = rawIdx % skills.length;
        const data = { ...baseCv, skills };
        const result = deleteSectionItem(data, 'skills', idx);

        expect(result.skills.length).toBe(skills.length - 1);

        // Relative order of remaining items preserved
        const expected = skills.filter((_, i) => i !== idx);
        expect(result.skills).toEqual(expected);

        // The item now at `idx` is the one that was previously at `idx + 1`
        if (idx < skills.length - 1) {
          expect(result.skills[idx]).toBe(skills[idx + 1]);
        }
      }),
    );
  });
});
