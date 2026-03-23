'use client';

import { useMemo } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import type { CvBuilderData } from '@/types/cv-builder';
import { ResumePDF } from './pdf/resume-pdf';

type Props = {
  data: CvBuilderData;
};

export function CvPreview({ data }: Props) {
  const document = useMemo(() => <ResumePDF data={data} />, [data]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-inner">
        <BlobProvider document={document}>
          {({ url, loading, error }) => {
            if (loading) {
              return (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-zinc-500">Đang tạo preview...</p>
                  </div>
                </div>
              );
            }
            if (error) {
              return (
                <div className="flex h-full items-center justify-center p-4">
                  <p className="text-sm text-red-500">Lỗi render PDF: {error.message}</p>
                </div>
              );
            }
            if (!url) return null;
            return (
              <iframe
                src={`${url}#toolbar=0&navpanes=0`}
                className="h-full w-full"
                title="CV Preview"
              />
            );
          }}
        </BlobProvider>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <BlobProvider document={document}>
          {({ url, loading }) => (
            <a
              href={url ?? '#'}
              download={`${data.profile.name || 'CV'}.pdf`}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                loading || !url
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              }`}
            >
              📥 Tải PDF
            </a>
          )}
        </BlobProvider>
      </div>
    </div>
  );
}
