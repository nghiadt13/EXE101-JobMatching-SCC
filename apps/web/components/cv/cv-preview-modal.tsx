'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Phone,
  Mail,
  Globe,
  MapPin,
  Target,
  GraduationCap,
  Layers,
  Award,
  Cpu,
  Languages as LanguagesIcon,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { getCvFileBlob, type CvItem } from '@/lib/cv-client';
import type { CvBuilderData } from '@/types/cv-builder';
import { toast } from 'sonner';

type CvPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cv: CvItem | null;
  accessToken?: string;
};

/**
 * `CvPreviewModal` renders the *actual* content of a CV.
 *
 * There are two kinds of CV in the system:
 *
 *   1. Uploaded CVs (`source !== 'builder'`): the real content is the original
 *      PDF/DOCX the candidate uploaded. We stream that file from the
 *      auth-protected `/cvs/:id/file` endpoint as a Blob, then render the PDF
 *      inline via an object URL (DOCX is offered as a download since browsers
 *      can't render it inline). Uploaded CVs are NOT parsed into structured
 *      data at upload time, so there is no per-field data to show — the file
 *      itself is the source of truth.
 *
 *   2. Builder CVs (`source === 'builder'`): the structured content lives in
 *      `parsedData.builderData`. We render those real fields directly.
 *
 * The previous implementation fabricated a hardcoded sample CV ("Đàm Trọng
 * Nghĩa", fake phone/github/certs) whenever structured data was missing —
 * which was always, for uploaded CVs — so every CV looked identical. That
 * mock fallback has been removed entirely.
 */
export function CvPreviewModal({
  isOpen,
  onClose,
  cv,
  accessToken,
}: CvPreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const isBuilderCv = cv?.source === 'builder';
  const isPdf = !!(cv?.mimeType === 'application/pdf' || cv?.fileName?.toLowerCase().endsWith('.pdf'));

  // ─── Uploaded file (PDF/DOCX) blob loading ──────────────────────────────
  const [fileState, setFileState] = useState<{
    cvId: string | null;
    url: string | null;
    error: boolean;
  }>({ cvId: null, url: null, error: false });
  const shouldLoadUploadedFile = isOpen && !!cv && !isBuilderCv;

  useEffect(() => {
    // Only uploaded CVs have a real file to stream.
    if (!shouldLoadUploadedFile || !cv || !accessToken) return;

    let revoked = false;
    let objectUrl: string | null = null;

    getCvFileBlob(accessToken, cv.id)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setFileState({ cvId: cv.id, url: objectUrl, error: false });
      })
      .catch(() => {
        if (revoked) return;
        setFileState({ cvId: cv.id, url: null, error: true });
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [shouldLoadUploadedFile, cv, accessToken]);

  const fileUrl = shouldLoadUploadedFile && cv && fileState.cvId === cv.id ? fileState.url : null;
  const fileStatus: 'idle' | 'loading' | 'ready' | 'error' = !shouldLoadUploadedFile
    ? 'idle'
    : !accessToken || (cv && fileState.cvId === cv.id && fileState.error)
      ? 'error'
      : fileUrl
        ? 'ready'
        : 'loading';

  // ─── Builder structured data ────────────────────────────────────────────
  const builderData = useMemo<CvBuilderData | null>(() => {
    if (!isBuilderCv) return null;
    const data = cv?.parsedData?.builderData;
    return data ?? null;
  }, [isBuilderCv, cv]);

  const handleDownload = useCallback(() => {
    if (isBuilderCv) {
      toast.info('Mở trình chỉnh sửa để tải CV builder dưới dạng PDF.');
      return;
    }
    if (fileUrl && cv) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = cv.fileName || 'CV';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      toast.error('File CV chưa sẵn sàng để tải xuống.');
    }
  }, [isBuilderCv, fileUrl, cv]);

  if (!isOpen || !cv) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước CV"
    >
      {/* Backdrop */}
      <div
        className="backdrop-blur-sm animate-in fade-in duration-200"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
        }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 overflow-hidden glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '896px',
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 glass bg-white/90 dark:bg-slate-900/90">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider block">
              {isBuilderCv ? 'Hồ sơ tạo trên hệ thống' : 'Tài liệu đã tải lên'}
            </span>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[300px] sm:max-w-md">
              {cv.fileName || 'CV Preview'}
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isPdf && !isBuilderCv && (
              <button
                onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                disabled={!fileUrl}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                title="Mở trong tab mới"
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer border-0"
            >
              <Download className="w-3.5 h-3.5" /> Tải xuống
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto bg-slate-100 dark:bg-slate-950">
          {isBuilderCv ? (
            <BuilderCvView data={builderData} />
          ) : (
            <UploadedFileView
              status={fileStatus}
              fileUrl={fileUrl}
              isPdf={isPdf}
              cv={cv}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
//  Uploaded file viewer (PDF inline / DOCX download)
// ───────────────────────────────────────────────────────────────────────────

function UploadedFileView({
  status,
  fileUrl,
  isPdf,
  cv,
  onDownload,
}: {
  status: 'idle' | 'loading' | 'ready' | 'error';
  fileUrl: string | null;
  isPdf: boolean;
  cv: CvItem;
  onDownload: () => void;
}) {
  const parsedPreview = !isPdf ? buildUploadedCvPreview(cv) : null;
  if (parsedPreview) {
    return <UploadedParsedCvView cv={parsedPreview} />;
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm">Đang tải nội dung CV...</p>
      </div>
    );
  }

  if (status === 'error' || !fileUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Không thể tải nội dung CV.
        </p>
        <p className="text-xs text-slate-400">
          File có thể đã bị xóa hoặc phiên đăng nhập đã hết hạn. Vui lòng thử lại.
        </p>
      </div>
    );
  }

  // PDF → render inline. The object URL carries the blob so no auth header is
  // needed on the iframe request.
  if (isPdf) {
    return (
      <iframe
        src={`${fileUrl}#toolbar=1&navpanes=0`}
        className="w-full h-full border-0 bg-white"
        title="CV Preview"
      />
    );
  }

  // DOCX (and any non-PDF) → browsers can't render inline, offer download
  // when there is no parsed profile data available.
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
        <FileText className="w-8 h-8" />
      </div>
      <div className="w-full max-w-sm space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {cv.fileName}
        </p>
        <p className="text-xs text-slate-400">
          Trình duyệt không hỗ trợ xem trước file Word (.docx) trực tiếp. Tải
          xuống để xem nội dung đầy đủ.
        </p>
      </div>
      <button
        onClick={onDownload}
        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer border-0"
      >
        <Download className="w-4 h-4" /> Tải xuống CV
      </button>
    </div>
  );
}

type UploadedPreviewModel = {
  title: string;
  headline: string;
  summary: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  location: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  experience: Array<{
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
    tech: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
};

function buildUploadedCvPreview(cv: CvItem): UploadedPreviewModel | null {
  const parsedData = asRecord(cv.parsedData);
  const normalizedProfile = asRecord(cv.normalizedProfile);
  const candidateProfile = cv.candidateProfile;
  const contact = asRecord(parsedData.contact);

  const summary = firstString(
    candidateProfile?.summary,
    normalizedProfile.summary,
    parsedData.summary,
  );
  const skills = preferStringArray(
    candidateProfile?.skills ?? [],
    preferStringArray(toStringArray(normalizedProfile.skills), preferStringArray(cv.skills, toStringArray(parsedData.skills))),
  );
  const certifications = preferStringArray(
    candidateProfile?.certifications ?? [],
    preferStringArray(toStringArray(normalizedProfile.certifications), toStringArray(parsedData.certifications)),
  );
  const languages = preferStringArray(
    candidateProfile?.languages ?? [],
    preferStringArray(toStringArray(normalizedProfile.languages), toStringArray(parsedData.languages)),
  );
  const experience = normalizeExperience(
    preferRecordArray(
      candidateProfile?.experience?.map((item) => ({
        role: item.role,
        company: item.company,
        startDate: item.startDate,
        endDate: item.endDate,
        tech: item.tech,
      })) ?? [],
      preferRecordArray(toRecordArray(normalizedProfile.experience), toRecordArray(parsedData.experience)),
    ),
  );
  const education = normalizeEducation(
    preferRecordArray(
      toRecordArray(candidateProfile?.education),
      preferRecordArray(toRecordArray(normalizedProfile.education), toRecordArray(parsedData.education)),
    ),
  );
  const projects = normalizeProjects(
    preferRecordArray(
      candidateProfile?.projects?.map((item) => ({
        name: item.name,
        description: item.description,
        tech: item.tech,
      })) ?? [],
      preferRecordArray(toRecordArray(normalizedProfile.projects), toRecordArray(parsedData.projects)),
    ),
  );

  const hasContent =
    summary ||
    skills.length ||
    certifications.length ||
    languages.length ||
    experience.length ||
    education.length ||
    projects.length;

  if (!hasContent) return null;

  const candidateLocation = candidateProfile?.location;
  const normalizedLocation = asRecord(normalizedProfile.location);
  const parsedLocation = asRecord(parsedData.location);

  return {
    title: cv.fileName,
    headline: firstString(candidateProfile?.headline, normalizedProfile.title, parsedData.title),
    summary,
    skills,
    certifications,
    languages,
    location: [
      firstString(candidateLocation?.city, normalizedLocation.city, parsedLocation.city),
      firstString(candidateLocation?.country, normalizedLocation.country, parsedLocation.country),
    ].filter(Boolean).join(', '),
    contact: {
      email: firstString(contact.email, contact.mail),
      phone: firstString(contact.phone, contact.mobile),
      website: firstString(contact.website, contact.linkedin, contact.github),
    },
    experience,
    education,
    projects,
  };
}

function UploadedParsedCvView({ cv }: { cv: UploadedPreviewModel }) {
  return (
    <div className="p-8 flex justify-center w-full">
      <div className="bg-white text-slate-900 w-full max-w-[210mm] shadow-lg border border-slate-200 p-8 sm:p-12 rounded-xl text-left font-sans text-xs relative select-text leading-relaxed h-fit">
        <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Xem nhanh từ dữ liệu đã phân tích</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-tight break-words">
              {cv.headline || cv.title}
            </h1>
            {cv.headline && (
              <p className="mt-2 text-sm font-bold text-brand-600 normal-case break-words">{cv.title}</p>
            )}
          </div>
          <div className="text-slate-500 space-y-1 sm:text-right text-[11px] font-medium min-w-fit">
            {cv.contact.phone && (
              <p className="flex items-center sm:justify-end gap-1"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {cv.contact.phone}</p>
            )}
            {cv.contact.email && (
              <p className="flex items-center sm:justify-end gap-1"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {cv.contact.email}</p>
            )}
            {cv.contact.website && (
              <p className="flex items-center sm:justify-end gap-1"><Globe className="w-3 h-3 text-slate-400 shrink-0" /> {cv.contact.website}</p>
            )}
            {cv.location && (
              <p className="flex items-center sm:justify-end gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {cv.location}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="md:col-span-2 space-y-6">
            {cv.summary && (
              <Section icon={<Target className="w-4 h-4 text-brand-500 shrink-0" />} title="Tóm tắt hồ sơ">
                <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{cv.summary}</p>
              </Section>
            )}
            {cv.experience.length > 0 && (
              <Section icon={<Layers className="w-4 h-4 text-brand-500 shrink-0" />} title="Kinh nghiệm làm việc">
                <Timeline rows={cv.experience} />
              </Section>
            )}
            {cv.education.length > 0 && (
              <Section icon={<GraduationCap className="w-4 h-4 text-brand-500 shrink-0" />} title="Học vấn">
                <Timeline rows={cv.education.map((item) => ({
                  role: item.degree || item.field,
                  company: item.school,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  description: item.field,
                  tech: [],
                }))} />
              </Section>
            )}
            {cv.projects.length > 0 && (
              <Section icon={<Layers className="w-4 h-4 text-brand-500 shrink-0" />} title="Dự án nổi bật">
                <div className="space-y-4">
                  {cv.projects.map((project, index) => (
                    <div key={`${project.name}-${index}`} className="space-y-1.5">
                      <h3 className="font-bold text-slate-800 text-[11px]">{project.name}</h3>
                      {project.description && <p className="text-slate-600 text-[11px] leading-relaxed">{project.description}</p>}
                      <ChipList items={project.tech} />
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            {cv.skills.length > 0 && (
              <Section icon={<Cpu className="w-4 h-4 text-brand-500 shrink-0" />} title="Kỹ năng">
                <ChipList items={cv.skills} />
              </Section>
            )}
            {cv.certifications.length > 0 && (
              <Section icon={<Award className="w-4 h-4 text-brand-500 shrink-0" />} title="Chứng chỉ">
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {cv.certifications.map((item, index) => <li key={`${item}-${index}`} className="font-medium">{item}</li>)}
                </ul>
              </Section>
            )}
            {cv.languages.length > 0 && (
              <Section icon={<LanguagesIcon className="w-4 h-4 text-brand-500 shrink-0" />} title="Ngôn ngữ">
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {cv.languages.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeline({ rows }: { rows: UploadedPreviewModel['experience'] }) {
  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={`${row.role}-${row.company}-${index}`} className="relative pl-4 border-l-2 border-brand-500/30 space-y-1">
          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
          <div className="flex justify-between items-start text-[11px] gap-2">
            <h3 className="font-bold text-slate-800">
              {[row.role, row.company].filter(Boolean).join(' @ ') || 'Thông tin'}
            </h3>
            {(row.startDate || row.endDate) && (
              <span className="text-slate-400 shrink-0">{row.startDate || '?'} - {row.endDate || 'Hiện tại'}</span>
            )}
          </div>
          {row.description && <p className="text-slate-600 text-[11px] leading-relaxed">{row.description}</p>}
          <ChipList items={row.tech} />
        </div>
      ))}
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
          {item}
        </span>
      ))}
    </div>
  );
}

function normalizeExperience(rows: Array<Record<string, unknown>>): UploadedPreviewModel['experience'] {
  return rows.map((row) => ({
    role: firstString(row.role, row.title, row.position),
    company: firstString(row.company, row.organization),
    startDate: firstString(row.startDate, row.start, row.from),
    endDate: firstString(row.endDate, row.end, row.to),
    description: firstString(row.description, row.summary),
    tech: toStringArray(row.tech).length ? toStringArray(row.tech) : toStringArray(row.technologies),
  })).filter((row) => row.role || row.company || row.description);
}

function normalizeEducation(rows: Array<Record<string, unknown>>): UploadedPreviewModel['education'] {
  return rows.map((row) => ({
    school: firstString(row.school, row.university, row.institution),
    degree: firstString(row.degree, row.qualification),
    field: firstString(row.field, row.major),
    startDate: firstString(row.startDate, row.start, row.from),
    endDate: firstString(row.endDate, row.end, row.to),
  })).filter((row) => row.school || row.degree || row.field);
}

function normalizeProjects(rows: Array<Record<string, unknown>>): UploadedPreviewModel['projects'] {
  return rows.map((row) => ({
    name: firstString(row.name, row.title),
    description: firstString(row.description, row.summary),
    tech: toStringArray(row.tech).length ? toStringArray(row.tech) : toStringArray(row.technologies),
  })).filter((row) => row.name || row.description);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === 'object' && !Array.isArray(item),
  );
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function preferRecordArray(
  primary: Array<Record<string, unknown>>,
  fallback: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return primary.length ? primary : fallback;
}

function preferStringArray(primary: string[], fallback: string[]): string[] {
  return primary.length ? primary : fallback;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

// ───────────────────────────────────────────────────────────────────────────
//  Builder CV viewer (real structured data, no mock fallback)
// ───────────────────────────────────────────────────────────────────────────

function BuilderCvView({ data }: { data: CvBuilderData | null }) {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Không tìm thấy dữ liệu CV.
        </p>
      </div>
    );
  }

  // Builder data may be partially populated (older rows, drafts), so every
  // array/field is defended against `undefined` before we read `.length` etc.
  const profile = data.profile ?? { name: '' };
  const experience = data.experience ?? [];
  const education = data.education ?? [];
  const skills = data.skills ?? [];
  const projects = data.projects ?? [];
  const certifications = data.certifications ?? [];
  const languages = data.languages ?? [];
  const contactParts = [profile.phone, profile.email, profile.website].filter(Boolean);
  const locationStr = [profile.location?.city, profile.location?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="p-8 flex justify-center w-full">
      <div className="bg-white text-slate-900 w-full max-w-[210mm] shadow-lg border border-slate-200 p-8 sm:p-12 rounded-xl text-left font-sans text-xs relative select-text leading-relaxed h-fit">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">
              {profile.name || 'Chưa có tên'}
            </h1>
            {profile.summary && (
              <p className="text-sm font-bold text-brand-600 mt-2 normal-case">
                {profile.summary.slice(0, 80)}
                {profile.summary.length > 80 ? '…' : ''}
              </p>
            )}
          </div>
          <div className="text-slate-500 space-y-1 sm:text-right text-[11px] font-medium min-w-fit">
            {profile.phone && (
              <p className="flex items-center sm:justify-end gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {profile.phone}
              </p>
            )}
            {profile.email && (
              <p className="flex items-center sm:justify-end gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {profile.email}
              </p>
            )}
            {profile.website && (
              <p className="flex items-center sm:justify-end gap-1">
                <Globe className="w-3 h-3 text-slate-400 shrink-0" /> {profile.website}
              </p>
            )}
            {locationStr && (
              <p className="flex items-center sm:justify-end gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {locationStr}
              </p>
            )}
          </div>
        </div>

        {!contactParts.length && !locationStr && !profile.summary && (
          <p className="text-slate-400 text-[11px] mt-4">Chưa có thông tin liên hệ.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {profile.summary && (
              <Section icon={<Target className="w-4 h-4 text-brand-500 shrink-0" />} title="Mục tiêu nghề nghiệp">
                <p className="text-slate-600 text-[11px] leading-relaxed">{profile.summary}</p>
              </Section>
            )}

            {experience.length > 0 && (
              <Section icon={<Layers className="w-4 h-4 text-brand-500 shrink-0" />} title="Kinh nghiệm làm việc">
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-brand-500/30 space-y-1">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                      <div className="flex justify-between items-start text-[11px] gap-2">
                        <h3 className="font-bold text-slate-800">
                          {exp.role}
                          {exp.company ? ` @ ${exp.company}` : ''}
                        </h3>
                        <span className="text-slate-400 shrink-0">
                          {exp.startDate} - {exp.endDate || 'Hiện tại'}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">{exp.description}</p>
                      )}
                      {exp.tech && exp.tech.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exp.tech.map((t) => (
                            <span key={t} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {education.length > 0 && (
              <Section icon={<GraduationCap className="w-4 h-4 text-brand-500 shrink-0" />} title="Học vấn">
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-brand-500/30 space-y-1">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                      <div className="flex justify-between items-start text-[11px] gap-2">
                        <h3 className="font-bold text-slate-800">{edu.school || edu.degree}</h3>
                        {(edu.startDate || edu.endDate) && (
                          <span className="text-slate-400 shrink-0">
                            {edu.startDate} - {edu.endDate || 'Hiện tại'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 font-medium">
                        {edu.degree}
                        {edu.field ? ` — ${edu.field}` : ''}
                      </p>
                      {edu.gpa && <p className="text-slate-400 text-[10px]">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {projects.length > 0 && (
              <Section icon={<Layers className="w-4 h-4 text-brand-500 shrink-0" />} title="Dự án nổi bật">
                <div className="space-y-4">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <h3 className="font-bold text-slate-800 text-[11px]">{proj.name}</h3>
                      {proj.description && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">{proj.description}</p>
                      )}
                      {proj.tech && proj.tech.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {proj.tech.map((t) => (
                            <span key={t} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {skills.length > 0 && (
              <Section icon={<Cpu className="w-4 h-4 text-brand-500 shrink-0" />} title="Kỹ năng">
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill) => (
                    <span key={skill} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {certifications.length > 0 && (
              <Section icon={<Award className="w-4 h-4 text-brand-500 shrink-0" />} title="Chứng chỉ">
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {certifications.map((c, i) => (
                    <li key={i} className="font-medium">{c}</li>
                  ))}
                </ul>
              </Section>
            )}

            {languages.length > 0 && (
              <Section icon={<LanguagesIcon className="w-4 h-4 text-brand-500 shrink-0" />} title="Ngôn ngữ">
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {languages.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}
