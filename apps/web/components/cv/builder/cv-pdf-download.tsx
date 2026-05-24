/**
 * cv-pdf-download.tsx — Lazy-loaded PDF download chunk for CV Builder 2.0.
 *
 * This module is the *lazy boundary* for `@react-pdf/renderer`. It is
 * intentionally NOT imported at the page level: the parent
 * `cv-builder-page.tsx` consumes it via
 *
 *     const PDFDownloadButton = dynamic(
 *       () => import('./cv-pdf-download').then(m => m.PDFDownloadButton),
 *       { ssr: false, loading: () => <span>Đang chuẩn bị...</span> },
 *     );
 *
 * That pattern keeps `@react-pdf/renderer` (~200 KB minified) out of the
 * main edit-page chunk, satisfying Requirement 12.3/12.4/12.5. Static
 * imports of `@react-pdf/renderer` and `./pdf/resume-pdf` are intentional
 * INSIDE this file because this file IS the lazy chunk — that is the whole
 * point of the boundary.
 *
 * Filename sanitisation:
 *   - Spaces collapse to a single `-`.
 *   - Non-alphanumeric characters (other than the `-` we just inserted) are
 *     stripped, so Unicode/Vietnamese accents and punctuation never reach
 *     the OS filesystem layer where they could cause download issues across
 *     browsers and operating systems.
 *   - When the resulting slug is empty (no name on the CV, or a name made
 *     entirely of punctuation/whitespace) we fall back to a plain
 *     `CV.pdf`, matching the behaviour required by Requirement 10.4.
 *
 * Requirements coverage: 10.1, 10.4, 10.9, 12.3, 12.4, 12.5.
 */

'use client';

import type { ReactNode } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import type { CvBuilderData } from '@/types/cv-builder';
import { ResumePDF } from './pdf/resume-pdf';

export interface PDFDownloadButtonProps {
  /** Full CV builder data tree to render into the PDF. */
  data: CvBuilderData;
  /** Optional className for the inner anchor/button. */
  className?: string;
  /** Button label, defaults to "Tải PDF". */
  children?: ReactNode;
}

/**
 * Build a filesystem-safe PDF filename from the candidate's name.
 *
 * Algorithm:
 *   1. Trim leading/trailing whitespace.
 *   2. Collapse internal whitespace runs into a single `-`.
 *   3. Strip every remaining non-alphanumeric character (the `-` we just
 *      inserted is preserved by the allow-list).
 *   4. Trim stray leading/trailing dashes that may appear after stripping.
 *   5. If the result is empty, return `CV.pdf`; otherwise return
 *      `CV-<slug>.pdf`.
 *
 * Examples:
 *   buildPdfFileName('')                  -> 'CV.pdf'
 *   buildPdfFileName('   ')               -> 'CV.pdf'
 *   buildPdfFileName('Jane Doe')          -> 'CV-Jane-Doe.pdf'
 *   buildPdfFileName('  Jane   Doe  ')    -> 'CV-Jane-Doe.pdf'
 *   buildPdfFileName('Nguyễn Văn An')     -> 'CV-Nguyn-Vn-An.pdf'   // accents stripped
 *   buildPdfFileName('***')               -> 'CV.pdf'
 *
 * Exported so unit tests (task 9.6) can pin the contract directly.
 */
export function buildPdfFileName(rawName: string | undefined | null): string {
  if (!rawName) return 'CV.pdf';

  const slug = rawName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');

  return slug.length === 0 ? 'CV.pdf' : `CV-${slug}.pdf`;
}

/**
 * `<PDFDownloadButton>` renders an `<a>` element that, when clicked,
 * triggers a client-side PDF render of the candidate's CV via
 * `@react-pdf/renderer` and downloads it with a sanitised filename.
 *
 * The component is the lazy-loaded chunk boundary — see module docstring.
 * It deliberately keeps its render tree minimal so the dynamic-import
 * loading state in the parent stays short.
 */
export function PDFDownloadButton({
  data,
  className,
  children,
}: PDFDownloadButtonProps): ReactNode {
  const fileName = buildPdfFileName(data.profile?.name);
  const document = <ResumePDF data={data} />;

  return (
    <PDFDownloadLink document={document} fileName={fileName} className={className}>
      {/*
        `PDFDownloadLink` accepts either a ReactNode or a render-prop
        function exposing `{ loading, error, blob, url }`. The render-prop
        form lets us swap the label while the PDF is being generated, which
        is especially useful for long CVs on slower devices.
      */}
      {({ loading, error }) => {
        if (error) return 'Lỗi tạo PDF';
        if (loading) return 'Đang tạo PDF...';
        return children ?? 'Tải PDF';
      }}
    </PDFDownloadLink>
  );
}
