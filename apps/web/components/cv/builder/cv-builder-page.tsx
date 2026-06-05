'use client';

/**
 * cv-builder-page.tsx — Top-level workspace shell for CV Builder 2.0.
 *
 * This component owns the three-panel layout, save orchestration, and zoom
 * state for the WYSIWYG editor:
 *
 *   ┌─────────── 64 px top bar ─────────────────────────────────────┐
 *   │ [← Back]   Chỉnh sửa CV   [save status]    [Lưu] [Tải PDF]    │
 *   ├──────────┬───────────────────────────────────┬────────────────┤
 *   │          │                                   │                │
 *   │ Section  │           CvHtmlCanvas            │ DesignSidebar  │
 *   │  Nav     │           (mid-panel)             │   (300 px)     │
 *   │ (240 px) │     [-] [%] [+] [Vừa vặn]         │                │
 *   │          │                                   │                │
 *   └──────────┴───────────────────────────────────┴────────────────┘
 *
 * Below 1024 px viewport width the side panels collapse: the canvas takes
 * the full row and `DesignSidebar` is shown via a slide-in drawer triggered
 * by a floating "Thiết kế" button.
 *
 * Save model (Requirement 6 family):
 *   - Auto-save: every keystroke on the canvas calls `handleUpdateData`,
 *     which flips `saveStatus` to `'dirty'` synchronously and schedules a
 *     debounced `PUT /cvs/:id/builder` via the `useAutoSave` hook. Multiple
 *     edits inside the 1.5 s window coalesce into a single network request.
 *   - Manual save: clicking the "Lưu" button invokes the `onSave` Server
 *     Action passed by the parent server component. This path performs the
 *     `revalidatePath` so the dashboard list reflects fresh data; auto-save
 *     intentionally avoids `revalidatePath` to stay lightweight.
 *
 * Backward compatibility:
 *   - `cvId` and `accessToken` are optional so the create-CV flow (which
 *     does not yet have an id) can still mount this component. When either
 *     is missing, auto-save is disabled and only the manual save button
 *     produces network traffic.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Plus,
  Maximize2,
  AlertTriangle,
  Save,
  X,
  Palette,
  FileText,
} from 'lucide-react';

import { CvHtmlCanvas } from './cv-html-canvas';
import { DesignSidebar } from './design-sidebar';
import { SectionNav } from './section-nav';
import { type SaveStatus } from '@/hooks/use-auto-save';
import {
  DEFAULT_DESIGN_TOKENS,
  type CvBuilderData,
  type CvDesignTokens,
  type TemplateId,
} from '@/types/cv-builder';
import {
  A4_PIXEL_WIDTH,
  DEFAULT_ZOOM,
  ZOOM_RANGE,
} from '@/types/cv-builder-constants';
import { cn } from '@/lib/cn';

/**
 * `<PDFDownloadButton>` is loaded lazily so `@react-pdf/renderer` (~200 KB)
 * never reaches the main page chunk. The static import lives inside
 * `cv-pdf-download.tsx`, which is the lazy boundary itself; this dynamic
 * call is the only reference to it from the workspace shell, satisfying
 * Requirements 12.3, 12.4, 12.5 (and Requirement 10.1 which mandates
 * `{ ssr: false }`).
 */
const PDFDownloadButton = dynamic(
  () => import('./cv-pdf-download').then((m) => m.PDFDownloadButton),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Đang chuẩn bị...
      </span>
    ),
  },
);

/**
 * Public props of {@link CvBuilderPage}.
 *
 * `cvId` and `accessToken` are optional because the "create CV" flow mounts
 * this component before the row exists in the database — in that case
 * auto-save is disabled and only the manual save button persists.
 */
export interface CvBuilderProps {
  /** Serialized snapshot from the database. */
  initialData: CvBuilderData;
  /** Required to enable auto-save (or manual save). Omit for preview/demo modes. */
  cvId?: string;
  accessToken?: string;
  hasPdfFile?: boolean;
  isNewUpload?: boolean;
  onSave?: (data: CvBuilderData) => Promise<string | null>;
}

/**
 * Numeric clamp helper used by the zoom toolbar. Snapping `value` into the
 * configured `[ZOOM_RANGE.min, ZOOM_RANGE.max]` window guarantees we never
 * emit an out-of-bounds zoom even when the slider is driven programmatically
 * (Requirement 9.4).
 */
function clampZoom(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_ZOOM;
  if (value < ZOOM_RANGE.min) return ZOOM_RANGE.min;
  if (value > ZOOM_RANGE.max) return ZOOM_RANGE.max;
  return value;
}

/**
 * Round a zoom value to the nearest `ZOOM_RANGE.step` so the displayed
 * percentage and the underlying CSS transform stay in lockstep with the
 * `[-]` / `[+]` buttons (which step by `ZOOM_RANGE.step`).
 */
function snapToStep(value: number): number {
  const steps = Math.round(value / ZOOM_RANGE.step);
  // Round to 2 decimals so 0.85 stays 0.85 instead of 0.8500000000001.
  return Math.round(steps * ZOOM_RANGE.step * 100) / 100;
}

/**
 * Top-bar save status indicator. Mirrors the four states surfaced by
 * {@link useAutoSave} (`saved` / `saving` / `dirty` / `error`) into a
 * Vietnamese label with a matching icon and colour. The `error` variant
 * exposes a `Thử lại` retry button that re-issues the most recent failed
 * payload (Requirement 6.6).
 */
function SaveStatusIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  if (status === 'saved') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
        data-testid="save-status-saved"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        Đã lưu
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600"
        data-testid="save-status-saving"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Đang lưu...
      </span>
    );
  }

  if (status === 'dirty') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700"
        data-testid="save-status-dirty"
      >
        <span
          className="h-2 w-2 rounded-full bg-amber-500"
          aria-hidden
        />
        Có thay đổi chưa lưu
      </span>
    );
  }

  // error
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
      data-testid="save-status-error"
    >
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      Lỗi lưu
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-red-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
        data-testid="save-status-retry"
      >
        Thử lại
      </button>
    </span>
  );
}

/**
 * Floating zoom toolbar pinned to the bottom-centre of the canvas panel.
 * Provides `[-]`, `[%]`, `[+]`, and `[Vừa vặn]` controls per Requirement 9.3
 * and clamps every interaction to the configured zoom range (Requirement
 * 9.4). The percentage label doubles as a "reset to 100 %" button so users
 * can quickly return to full size.
 */
function ZoomToolbar({
  zoom,
  onChange,
  onFit,
}: {
  zoom: number;
  onChange: (next: number) => void;
  onFit: () => void;
}) {
  const percent = Math.round(zoom * 100);
  return (
    <div
      className="pointer-events-auto flex items-center gap-1 rounded-full border border-zinc-200 bg-white/95 px-2 py-1 shadow-md backdrop-blur"
      role="toolbar"
      aria-label="Zoom"
      data-testid="zoom-toolbar"
    >
      <button
        type="button"
        onClick={() => onChange(clampZoom(snapToStep(zoom - ZOOM_RANGE.step)))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
        disabled={zoom <= ZOOM_RANGE.min + 1e-6}
        aria-label="Thu nhỏ"
        data-testid="zoom-out"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="min-w-[3rem] rounded-full px-2 py-1 text-xs font-semibold tabular-nums text-zinc-700 hover:bg-zinc-100"
        aria-label="Đặt lại 100%"
        title="Đặt lại 100%"
        data-testid="zoom-reset"
      >
        {percent}%
      </button>
      <button
        type="button"
        onClick={() => onChange(clampZoom(snapToStep(zoom + ZOOM_RANGE.step)))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
        disabled={zoom >= ZOOM_RANGE.max - 1e-6}
        aria-label="Phóng to"
        data-testid="zoom-in"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />
      <button
        type="button"
        onClick={onFit}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        aria-label="Vừa vặn"
        data-testid="zoom-fit"
      >
        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        Vừa vặn
      </button>
    </div>
  );
}

/**
 * Workspace shell coordinating the three panels, save flow, zoom, and
 * responsive drawer. See module docstring for the high-level picture.
 *
 * State summary:
 *   - `cvData`              — single source of truth for CV content + design
 *                             tokens; all mutations go through `setCvData`.
 *   - `zoom`                — scale factor applied to the canvas root.
 *   - `isMobileSidebarOpen` — drives the slide-in `DesignSidebar` drawer at
 *                             viewports < 1024 px (Requirement 9.2).
 *   - `manualSaveError`     — surfaced after a failed manual save, distinct
 *                             from the auto-save status so an error in one
 *                             path does not mask success in the other.
 *
 * Auto-save is delegated to the `useAutoSave` hook which owns its own
 * `saveStatus` machine. We mirror its `dirty` flag synchronously inside
 * `handleUpdateData` so the indicator updates on the same React tick the
 * user typed (Requirement 6.2).
 */
export function CvBuilderPage({
  initialData,
  cvId,
  accessToken,
  hasPdfFile = false,
  isNewUpload = false,
  onSave = async () => null,
}: CvBuilderProps) {
  const router = useRouter();
  // ─── State ─────────────────────────────────────────────────────────────
  const [cvData, setCvData] = useState<CvBuilderData>(() => initialData);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);
  const [manualSaveJustSucceeded, setManualSaveJustSucceeded] = useState(false);
  const [isManualSaving, startManualSave] = useTransition();
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (!hasPdfFile || !accessToken || !cvId) return;
    
    let active = true;
    let url: string | null = null;
    
    import('@/lib/cv-client').then(({ fetchCvFile }) => {
      fetchCvFile(accessToken, cvId).then(blob => {
        if (active) {
          url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setShowPdf(true);
        }
      }).catch(console.error);
    });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [hasPdfFile, accessToken, cvId]);

  // Removed useAutoSave hooks, replacing with local `isDirty` state
  const [isDirty, setIsDirty] = useState(isNewUpload);

  // Keep the latest `cvData` in a ref so the "fit to width" computation can
  // be invoked from a `ResizeObserver` callback (which captures stale state)
  // without forcing the user back to the saved snapshot.
  const cvDataRef = useRef(cvData);
  useEffect(() => {
    cvDataRef.current = cvData;
  }, [cvData]);

  const hasSavedAtLeastOnce = useRef(false);
  useEffect(() => {
    if (manualSaveJustSucceeded) {
      hasSavedAtLeastOnce.current = true;
    }
  }, [manualSaveJustSucceeded]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = isDirty || (hasPdfFile && !hasSavedAtLeastOnce.current);
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPdfFile, isDirty]);

  const [navInterceptUrl, setNavInterceptUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const hasUnsavedChanges = isDirty || (hasPdfFile && !hasSavedAtLeastOnce.current);
      if (hasUnsavedChanges) {
        const target = (e.target as HTMLElement).closest('a');
        if (target && target.href && !target.hasAttribute('download') && target.target !== '_blank') {
          try {
            const url = new URL(target.href);
            if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
              e.preventDefault();
              e.stopPropagation();
              setNavInterceptUrl(target.href);
              dialogRef.current?.showModal();
            }
          } catch (err) {}
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [hasPdfFile, isDirty]);

  // Refs used by the canvas + zoom toolbar.
  const midPanelRef = useRef<HTMLDivElement | null>(null);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────

  /**
   * Commit a CV-data mutation produced by the canvas / templates / inline
   * editors. Updates state immutably, flips the auto-save indicator to
   * `'dirty'` synchronously (Requirement 6.2) and schedules a debounced
   * server flush via {@link useAutoSave.debouncedSave}.
   */
  const handleUpdateData = useCallback(
    (next: CvBuilderData) => {
      setCvData(next);
      setManualSaveError(null);
      setManualSaveJustSucceeded(false);
      setIsDirty(true);
    },
    [],
  );

  /**
   * Replace the active design tokens. Identical save semantics to
   * {@link handleUpdateData} but scoped to the `designTokens` slice so the
   * sliders / colour pickers do not have to reconstruct the whole CV.
   */
  const handleChangeTokens = useCallback(
    (tokens: CvDesignTokens) => {
      handleUpdateData({ ...cvDataRef.current, designTokens: tokens });
    },
    [handleUpdateData],
  );

  /**
   * Switch the active template. Same save semantics as
   * {@link handleUpdateData}; written inline rather than wrapping the
   * sidebar's onChange so we can keep the prop names aligned with
   * `DesignSidebarProps` exactly.
   */
  const handleChangeTemplate = useCallback(
    (id: TemplateId) => {
      handleUpdateData({ ...cvDataRef.current, templateId: id });
    },
    [handleUpdateData],
  );

  /**
   * Manual save / publish path. Distinct from auto-save: this calls the
   * Server Action `onSave` which issues a `revalidatePath` so the
   * dashboard list refreshes (Requirement 6.9). We use `useTransition`
   * so the button reflects pending state without freezing the UI, and we
   * surface the resolved error string when the action returns one.
   */
  const handleManualSave = useCallback(() => {
    setManualSaveError(null);
    setManualSaveJustSucceeded(false);
    startManualSave(async () => {
      try {
        const error = await onSave(cvDataRef.current);
        if (error) {
          setManualSaveError(error);
          toast.error(error);
        } else {
          setManualSaveJustSucceeded(true);
          setIsDirty(false); // Reset dirty flag
          toast.success('Đã mã hóa thành công, sẵn sàng cho tìm kiếm việc!');
        }
      } catch {
        const errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setManualSaveError(errorMsg);
        toast.error(errorMsg);
      }
    });
  }, [onSave]);

  /**
   * Clear the transient "Đã lưu thủ công" badge after a couple of seconds
   * so the top bar returns to the auto-save status indicator without the
   * user having to click anywhere.
   */
  useEffect(() => {
    if (!manualSaveJustSucceeded) return;
    const id = window.setTimeout(() => setManualSaveJustSucceeded(false), 2000);
    return () => window.clearTimeout(id);
  }, [manualSaveJustSucceeded]);

  /**
   * "Vừa vặn" — compute the zoom that fits the A4 page width (`794 px`)
   * inside the available middle-panel width, with a small padding so the
   * page edges are not flush against the panel borders. The result is
   * clamped to `ZOOM_RANGE` per Requirement 9.4 and snapped to the
   * configured step.
   */
  const handleFitToWidth = useCallback(() => {
    const panel = midPanelRef.current;
    if (!panel) return;
    const padding = 48; // breathing room around the page (24 px each side)
    const available = Math.max(panel.clientWidth - padding, 0);
    if (available <= 0) {
      setZoom(DEFAULT_ZOOM);
      return;
    }
    const raw = available / A4_PIXEL_WIDTH;
    setZoom(snapToStep(clampZoom(raw)));
  }, []);

  /**
   * Bound-checked setter exposed to the zoom toolbar. Centralising the
   * clamp here means `[-]` / `[+]` / `[Vừa vặn]` and any future programmatic
   * caller all share the same invariant.
   */
  const handleZoomChange = useCallback((next: number) => {
    setZoom(clampZoom(next));
  }, []);

  // ─── Layout ────────────────────────────────────────────────────────────

  // Memoised inline style for the workspace container so re-renders driven
  // by typing (which mutate `cvData`) do not invalidate the style object.
  const workspaceStyle: CSSProperties = useMemo(() => ({}), []);

  // Determines whether to render the auto-save indicator at all. The create
  // flow has no id → auto-save is off → there is nothing to display.
  const showAutoSaveIndicator = Boolean(cvId && accessToken);

  let saveStatus: SaveStatus = 'saved';
  if (isManualSaving) {
    saveStatus = 'saving';
  } else if (manualSaveError) {
    saveStatus = 'error';
  } else if (isDirty || (hasPdfFile && !hasSavedAtLeastOnce.current)) {
    saveStatus = 'dirty';
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-zinc-50 font-sans antialiased">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/candidate/cvs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            data-testid="cv-builder-back-link"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Link>
          <h1 className="hidden text-base font-semibold text-zinc-900 sm:block">
            Chỉnh sửa CV
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {showAutoSaveIndicator ? (
            <SaveStatusIndicator
              status={saveStatus}
              onRetry={handleManualSave}
            />
          ) : null}
          {manualSaveError ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
              data-testid="manual-save-error"
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {manualSaveError}
            </span>
          ) : null}
          {manualSaveJustSucceeded ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
              data-testid="manual-save-success"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Đã lưu
            </span>
          ) : null}

          {hasPdfFile && pdfBlobUrl ? (
            <button
              type="button"
              onClick={() => setShowPdf(!showPdf)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <FileText className="h-4 w-4" aria-hidden />
              {showPdf ? 'Ẩn bản gốc' : 'Xem bản gốc'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleManualSave}
            disabled={isManualSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="cv-builder-save-button"
          >
            {isManualSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Lưu
          </button>

          <PDFDownloadButton
            data={cvData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tải PDF
          </PDFDownloadButton>
        </div>
      </div>

      {/* ─────────────── Three-panel workspace — Requirement 9.1 ──────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: SectionNav (≥1024 px only) */}
        <div className="hidden lg:block">
          <SectionNav scrollContainerRef={canvasScrollRef} />
        </div>

        {/* Middle: Canvas + floating zoom toolbar */}
        <div
          ref={midPanelRef}
          className="relative min-w-0 flex-1 overflow-hidden"
          data-testid="cv-builder-mid-panel"
        >
          <div
            ref={canvasScrollRef}
            className="h-full overflow-auto px-4 py-6"
            data-testid="cv-builder-canvas-scroll"
          >
            <CvHtmlCanvas
              data={cvData}
              onChange={handleUpdateData}
              zoom={zoom}
            />
          </div>

          {/* Floating zoom toolbar pinned to the bottom-centre of the panel */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <ZoomToolbar
              zoom={zoom}
              onChange={handleZoomChange}
              onFit={handleFitToWidth}
            />
          </div>

          {/* Mobile-only floating button to open the design drawer */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-md hover:bg-zinc-50 lg:hidden"
            aria-label="Mở bảng thiết kế"
            data-testid="cv-builder-open-design-drawer"
          >
            <Palette className="h-4 w-4" aria-hidden />
            Thiết kế
          </button>
        </div>

        {/* Right Middle: PDF Viewer (if enabled) */}
        {showPdf && pdfBlobUrl ? (
          <div className="hidden lg:flex w-[450px] shrink-0 flex-col border-l border-zinc-200 bg-zinc-100 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex h-12 shrink-0 items-center px-4 border-b border-zinc-200 bg-white justify-between">
              <span className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> File PDF Gốc
              </span>
              <button 
                onClick={() => setShowPdf(false)}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-800"
                title="Đóng bản gốc"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe src={pdfBlobUrl} className="flex-1 w-full border-none" title="Original PDF" />
          </div>
        ) : (
          <div className="hidden lg:block">
            <DesignSidebar
              templateId={cvData.templateId}
              tokens={cvData.designTokens ?? DEFAULT_DESIGN_TOKENS}
              onChangeTemplate={handleChangeTemplate}
              onChangeTokens={handleChangeTokens}
            />
          </div>
        )}

        {/* ─── Mobile drawer for DesignSidebar (<1024 px) — Req 9.2 ───── */}
        <div
          className={cn(
            'fixed inset-0 z-40 lg:hidden',
            isMobileSidebarOpen ? '' : 'pointer-events-none',
          )}
          aria-hidden={!isMobileSidebarOpen}
        >
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity duration-200',
              isMobileSidebarOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div
            className={cn(
              'absolute right-0 top-0 h-full w-[300px] max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-200',
              isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            data-testid="cv-builder-design-drawer"
          >
            <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-3">
              <span className="text-sm font-semibold text-zinc-700">
                Thiết kế
              </span>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
                aria-label="Đóng bảng thiết kế"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <DesignSidebar
                templateId={cvData.templateId}
                tokens={cvData.designTokens ?? DEFAULT_DESIGN_TOKENS}
                onChangeTemplate={handleChangeTemplate}
                onChangeTokens={handleChangeTokens}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Intercept Modal */}
      <dialog
        ref={dialogRef}
        className="m-auto w-[400px] max-w-[90vw] rounded-2xl border border-blue-100 bg-white p-6 shadow-xl backdrop:bg-blue-900/30 open:animate-in open:fade-in-0 open:zoom-in-95"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current?.close();
            setNavInterceptUrl(null);
          }
        }}
      >
        <h2 className="text-lg font-semibold text-slate-900">Bạn chưa lưu thay đổi</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bạn có thay đổi chưa được lưu. Bạn có muốn lưu thay đổi này trước khi rời đi không?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              dialogRef.current?.close();
              setNavInterceptUrl(null);
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            onClick={() => {
              dialogRef.current?.close();
              hasSavedAtLeastOnce.current = true;
              if (navInterceptUrl) window.location.href = navInterceptUrl;
            }}
          >
            Không lưu
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={async () => {
              try {
                await onSave(cvDataRef.current);
                hasSavedAtLeastOnce.current = true;
                toast.success('Đã mã hóa thành công, sẵn sàng cho tìm kiếm việc!');
                dialogRef.current?.close();
                if (navInterceptUrl) window.location.href = navInterceptUrl;
              } catch (e) {
                console.error(e);
                toast.error('Đã xảy ra lỗi khi lưu.');
              }
            }}
          >
            Có, lưu lại
          </button>
        </div>
      </dialog>
    </div>
  );
}
