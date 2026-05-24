import type { CvBuilderData } from '@/types/cv-builder';

/**
 * Keys of `CvBuilderData` whose value is an array of repeating items.
 *
 * These are the sections that can be reordered or have items deleted via the
 * BlockOverlay toolbar:
 *   `experience`, `education`, `skills`, `projects`, `certifications`, `languages`.
 *
 * The mapped type derives this set automatically from the `CvBuilderData`
 * shape so adding/removing array fields stays in sync without manual edits.
 */
export type ReorderableSectionKey = {
  [K in keyof CvBuilderData]-?: NonNullable<CvBuilderData[K]> extends readonly unknown[] ? K : never;
}[keyof CvBuilderData];

export type ReorderDirection = 'up' | 'down';

/**
 * Returns a new `CvBuilderData` with the item at `index` of `sectionKey`
 * swapped with its neighbour in the given `direction`.
 *
 * Bounds checking:
 *   - If `index` is not a valid position in the section array, the input
 *     `data` is returned unchanged (referentially equal).
 *   - If the swap target (index ± 1) is out of bounds (e.g. moving the first
 *     item up or the last item down), the input `data` is returned unchanged.
 *
 * Immutability:
 *   - The returned object is a fresh `CvBuilderData` reference whenever a
 *     swap is performed; the affected section array is also a fresh
 *     reference. Other section arrays keep their original references.
 *
 * Postconditions on a successful swap:
 *   - `result[sectionKey].length === data[sectionKey].length`.
 *   - The items at `index` and `index ± 1` are swapped; all other items
 *     remain at their original positions.
 *   - Applying `reorderSection` twice with opposite `direction` values on
 *     the same valid `index` reproduces the original array contents
 *     (involution under valid moves).
 */
export function reorderSection<K extends ReorderableSectionKey>(
  data: CvBuilderData,
  sectionKey: K,
  index: number,
  direction: ReorderDirection,
): CvBuilderData {
  const list = data[sectionKey] as readonly unknown[];

  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    return data;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return data;
  }

  const next = list.slice();
  const tmp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = tmp;

  return { ...data, [sectionKey]: next } as CvBuilderData;
}

/**
 * Returns a new `CvBuilderData` with the item at `index` of `sectionKey`
 * removed from the section array.
 *
 * Bounds checking:
 *   - If `index` is not a valid position in the section array, the input
 *     `data` is returned unchanged (referentially equal).
 *
 * Immutability:
 *   - When an item is removed, the returned object is a fresh
 *     `CvBuilderData` reference and the affected section array is rebuilt
 *     via `Array.prototype.filter`. Other section arrays keep their
 *     original references.
 *
 * Postconditions on a successful delete:
 *   - `result[sectionKey].length === data[sectionKey].length - 1`.
 *   - The remaining items appear in the same relative order as in `data`.
 *   - The item formerly at `index` is no longer present at that position.
 */
export function deleteSectionItem<K extends ReorderableSectionKey>(
  data: CvBuilderData,
  sectionKey: K,
  index: number,
): CvBuilderData {
  const list = data[sectionKey] as readonly unknown[];

  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    return data;
  }

  const next = list.filter((_, i) => i !== index);
  return { ...data, [sectionKey]: next } as CvBuilderData;
}
