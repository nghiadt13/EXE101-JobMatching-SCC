'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

type CvOption = {
  id: string;
  fileName: string;
  isPrimary: boolean;
};

type ApplyJobButtonProps = {
  jobId: string;
  cvs: CvOption[] | null;
  canApply: boolean;
  isAuthenticated: boolean;
  loginUrl: string;
  uploadCvUrl: string;
  applyAction: (formData: FormData) => Promise<void>;
};

export function ApplyJobButton({
  jobId,
  cvs,
  canApply,
  isAuthenticated,
  loginUrl,
  uploadCvUrl,
  applyAction,
}: ApplyJobButtonProps) {
  const [open, setOpen] = useState(false);
  const defaultCvId = cvs && cvs.length > 0
    ? (cvs.find((cv) => cv.isPrimary)?.id ?? cvs[0].id)
    : '';
  const [selectedCvId, setSelectedCvId] = useState<string>(defaultCvId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);



  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleButtonClick() {
    if (!isAuthenticated) {
      window.location.href = loginUrl;
      return;
    }
    if (!canApply) {
      return;
    }
    setError(null);
    setOpen(true);
  }

  function handleSubmit() {
    if (!selectedCvId) {
      setError('Please select a CV to apply.');
      return;
    }

    trackEvent('apply_attempted', {
      hasPrimaryCv: cvs?.some((cv) => cv.isPrimary) ?? false,
    });

    const formData = new FormData();
    formData.set('jobId', jobId);
    formData.set('cvId', selectedCvId);

    startTransition(async () => {
      try {
        await applyAction(formData);
        // If applyAction redirects, this won't execute.
        // If it doesn't redirect (error case handled via searchParams), close modal.
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  }

  const hasCvs = cvs && cvs.length > 0;

  return (
    <>
      {/* Apply Now Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 active:scale-[0.97]"
      >
        Apply Now
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-[28rem] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-[slideUp_250ms_ease-out] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">description</span>
                </div>
                <div>
                  <h2 id="apply-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Apply with your CV
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a CV from your uploaded documents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isPending && setOpen(false)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={isPending}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-b border-slate-200 dark:border-slate-700" />

            {/* Body */}
            <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
              {hasCvs ? (
                <div className="space-y-2">
                  {cvs.map((cv) => (
                    <label
                      key={cv.id}
                      className={`
                        flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150
                        ${selectedCvId === cv.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="cvSelect"
                        value={cv.id}
                        checked={selectedCvId === cv.id}
                        onChange={() => setSelectedCvId(cv.id)}
                        className="sr-only"
                      />

                      {/* Radio indicator */}
                      <div
                        className={`
                          size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
                          ${selectedCvId === cv.id
                            ? 'border-primary bg-primary'
                            : 'border-slate-300 dark:border-slate-600'
                          }
                        `}
                      >
                        {selectedCvId === cv.id && (
                          <div className="size-2 rounded-full bg-white" />
                        )}
                      </div>

                      {/* CV icon */}
                      <div className="size-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">
                          picture_as_pdf
                        </span>
                      </div>

                      {/* CV info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {cv.fileName}
                        </p>
                        {cv.isPrimary && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>star</span>
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Check icon when selected */}
                      {selectedCvId === cv.id && (
                        <span className="material-symbols-outlined text-primary text-xl shrink-0">
                          check_circle
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                /* No CVs uploaded */
                <div className="text-center py-6">
                  <div className="size-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-400">upload_file</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No CV uploaded yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Please upload a CV first to apply for this job.
                  </p>
                  <Link
                    href={uploadCvUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    Upload CV
                  </Link>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {hasCvs && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700" />
                <div className="px-6 py-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => !isPending && setOpen(false)}
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !selectedCvId}
                    className="flex-1 py-2.5 px-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
