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
  token?: string;
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
  token,
}: CvPreviewModalProps) {
  const activeToken = accessToken || token;

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
  const isPdf = cv?.mimeType === 'application/pdf';

  // ─── Uploaded file (PDF/DOCX) blob loading ──────────────────────────────
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    // Only uploaded CVs have a real file to stream.
    if (!isOpen || !cv || isBuilderCv) {
      setFileStatus('idle');
      return;
    }
    if (!activeToken) {
      setFileStatus('error');
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;
    setFileStatus('loading');
    setFileUrl(null);

    getCvFileBlob(activeToken, cv.id)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);
        setFileStatus('ready');
      })
      .catch(() => {
        if (revoked) return;
        setFileStatus('error');
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, cv, isBuilderCv, activeToken]);

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
              fileName={cv.fileName}
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
  fileName,
  onDownload,
}: {
  status: 'idle' | 'loading' | 'ready' | 'error';
  fileUrl: string | null;
  isPdf: boolean;
  fileName: string;
  onDownload: () => void;
}) {
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

  // DOCX (and any non-PDF) → browsers can't render inline, offer download.
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
        <FileText className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {fileName}
        </p>
        <p className="text-xs text-slate-400 max-w-sm">
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
