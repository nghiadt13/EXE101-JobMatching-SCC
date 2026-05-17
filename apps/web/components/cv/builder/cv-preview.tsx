'use client';

import { useMemo, useState } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import { ZoomIn, ZoomOut, Monitor } from 'lucide-react';
import type { CvBuilderData } from '@/types/cv-builder';
import { ResumePDF } from './pdf/resume-pdf';

type Props = {
  data: CvBuilderData;
};

export function CvPreview({ data }: Props) {
  const document = useMemo(() => <ResumePDF data={data} />, [data]);
  const [scale, setScale] = useState(1);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-800 shadow-inner p-4 sm:p-8 flex items-start justify-center">
        <BlobProvider document={document}>
          {({ url, loading, error }) => {
            if (loading) {
              return (
                <div className="flex h-[200px] w-[500px] items-center justify-center bg-white rounded-md shadow-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-zinc-500">Đang tạo PDF...</p>
                  </div>
                </div>
              );
            }
            if (error) {
              return (
                <div className="flex h-[200px] w-[500px] items-center justify-center bg-white rounded-md shadow-lg p-4">
                  <p className="text-sm text-red-500">Lỗi render PDF: {error.message}</p>
                </div>
              );
            }
            if (!url) return null;
            return (
              <div 
                style={{ 
                  width: `${794 * scale}px`, 
                  height: `${1123 * scale}px`, 
                  minWidth: `${794 * scale}px`,
                  transition: 'all 0.2s ease-out' 
                }}
                className="relative shrink-0 flex items-start justify-center"
              >
                <iframe
                  src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                  className="w-full h-full bg-white shadow-2xl rounded-sm"
                  title="CV Preview"
                />
              </div>
            );
          }}
        </BlobProvider>

        {/* Floating Zoom Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900/90 px-3 py-2 text-white shadow-2xl backdrop-blur-md border border-white/10">
          <button 
            type="button"
            onClick={() => setScale(s => Math.max(0.4, s - 0.1))} 
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
            title="Thu nhỏ"
          >
            <ZoomOut size={18} />
          </button>
          
          <button 
            type="button"
            onClick={() => setScale(1)} 
            className="flex h-8 items-center justify-center min-w-14 rounded transition-colors hover:bg-white/10 active:scale-95 text-[13px] font-semibold tracking-wide"
            title="Mặc định (100%)"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            type="button"
            onClick={() => setScale(s => Math.min(2.5, s + 0.1))} 
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
            title="Phóng to"
          >
            <ZoomIn size={18} />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button 
            type="button"
            onClick={() => setScale(0.7)} 
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
            title="Vừa màn hình (70%)"
          >
            <Monitor size={17} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <BlobProvider document={document}>
          {({ url, loading }) => (
            <a
              href={url ?? '#'}
              download={`${data.profile.name || 'CV'}.pdf`}
              className={`inline-flex items-center gap-2 rounded-xl px-12 py-3 text-[15px] font-bold transition-all ${
                loading || !url
                  ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              📥 Tải CV xuống máy
            </a>
          )}
        </BlobProvider>
      </div>
    </div>
  );
}
