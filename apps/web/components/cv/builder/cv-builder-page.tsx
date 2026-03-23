'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { CvBuilderData, TemplateId } from '@/types/cv-builder';
import { CvBuilderForm } from './cv-builder-form';
import { ThemePicker } from './theme-picker';
import { AiSuggestionPanel } from './ai-suggestion-panel';

// Dynamic import for react-pdf (SSR incompatible)
const CvPreview = dynamic(() => import('./cv-preview').then((m) => ({ default: m.CvPreview })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-zinc-500">Đang tải PDF renderer...</p>
      </div>
    </div>
  ),
});

type Props = {
  initialData: CvBuilderData;
  cvId?: string;
  accessToken?: string;
  onSave: (data: CvBuilderData) => Promise<string | null>;
};

type RightPanel = 'preview' | 'ai';

export function CvBuilderPage({ initialData, cvId, accessToken, onSave }: Props) {
  const [cvData, setCvData] = useState<CvBuilderData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');

  const handleTemplateChange = (templateId: TemplateId) => {
    setCvData({ ...cvData, templateId });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const error = await onSave(cvData);
      if (error) setSaveError(error);
    } catch {
      setSaveError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyRewrite = useCallback(
    (section: string, newText: string) => {
      setCvData((prev) => {
        // Apply the rewrite based on the section
        if (section === 'summary') {
          return {
            ...prev,
            profile: { ...prev.profile, summary: newText },
          };
        }
        // For other sections, we can't directly apply free-text rewrites
        // but we show a toast / alert about it
        return prev;
      });
    },
    [],
  );

  const canShowAi = Boolean(cvId && accessToken);

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/candidate/cvs"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ← Quay lại
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">
            {cvId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker templateId={cvData.templateId} onChange={handleTemplateChange} />

          {/* Desktop: panel switcher */}
          {canShowAi && (
            <div className="hidden lg:flex items-center rounded-lg border border-zinc-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setRightPanel('preview')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  rightPanel === 'preview'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                👁 Preview
              </button>
              <button
                type="button"
                onClick={() => setRightPanel('ai')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  rightPanel === 'ai'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                🤖 AI Gợi ý
              </button>
            </div>
          )}

          {/* Mobile: toggle buttons */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setShowPreview(!showPreview);
                setRightPanel('preview');
              }}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {showPreview && rightPanel === 'preview' ? '📝 Form' : '👁 Preview'}
            </button>
            {canShowAi && (
              <button
                type="button"
                onClick={() => {
                  if (showPreview && rightPanel === 'ai') {
                    setShowPreview(false);
                  } else {
                    setShowPreview(true);
                    setRightPanel('ai');
                  }
                }}
                className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
              >
                🤖 AI
              </button>
            )}
          </div>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form panel */}
        <div
          className={`w-full overflow-y-auto p-4 lg:w-1/2 lg:border-r lg:border-zinc-200 ${
            showPreview ? 'hidden lg:block' : ''
          }`}
        >
          <CvBuilderForm
            data={cvData}
            onChange={setCvData}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        {/* Right panel (Preview or AI) */}
        <div
          className={`w-full overflow-y-auto lg:block lg:w-1/2 ${
            showPreview ? '' : 'hidden lg:block'
          }`}
          style={{ minHeight: 600 }}
        >
          {rightPanel === 'preview' ? (
            <div className="bg-zinc-50 p-4 h-full">
              <CvPreview data={cvData} />
            </div>
          ) : cvId && accessToken ? (
            <AiSuggestionPanel
              cvId={cvId}
              accessToken={accessToken}
              onApplyRewrite={handleApplyRewrite}
              onClose={() => setRightPanel('preview')}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
