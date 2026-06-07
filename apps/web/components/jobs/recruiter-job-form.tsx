"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { PendingButton } from '@/components/ui/pending-button';
import { formatMultilineList } from '@/lib/job-description-format';
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_VALUES,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVEL_VALUES,
  JOB_LEVEL_LABELS,
  JOB_LEVEL_VALUES,
  SALES_MODEL_LABELS,
  SALES_MODEL_VALUES,
  WORKING_DAY_STATUS_LABELS,
  WORKING_DAY_STATUS_VALUES,
} from '@/lib/job-filter-options';

type RecruiterJobFormProps = {
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    title?: string;
    summary?: string;
    requirements?: string[];
    benefits?: string[];
    skills?: string[];
    certifications?: string[];
    employmentType?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    workingDayStatus?: string;
    experienceLevel?: string;
    minExperienceMonths?: number | null;
    jobLevel?: string;
    salesModel?: string;
    salaryNegotiable?: boolean;
    applicationDeadline?: string;
    customerTypes?: string[];
    categorySlugs?: string[];
  };
};

const inputClass =
  'h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2';
const textareaClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2';

function normalizeEmploymentType(value?: string): string {
  if (!value) return 'FULL_TIME';
  const raw = value.trim().toUpperCase().replace(/[-_]/g, ' ');
  if (raw.includes('FULL') || raw.includes('TOÀN THỜI GIAN')) {
    return 'FULL_TIME';
  }
  if (raw.includes('PART') || raw.includes('BÁN THỜI GIAN')) {
    return 'PART_TIME';
  }
  if (raw.includes('INTERN') || raw.includes('THỰC TẬP')) {
    return 'INTERN';
  }
  return 'OTHER';
}

export function RecruiterJobForm({ submitLabel, action, initialValues }: RecruiterJobFormProps) {
  const initialSkills = initialValues?.skills ?? [];
  const parsedInitialSkills = initialSkills.map(skill => {
    let type: 'required' | 'preferred' = 'required';
    let label = skill;
    if (skill.endsWith('(Ưu tiên)')) {
      type = 'preferred';
      label = skill.replace(/\s*\(Ưu tiên\)/, '').trim();
    } else if (skill.endsWith('(Bắt buộc)')) {
      type = 'required';
      label = skill.replace(/\s*\(Bắt buộc\)/, '').trim();
    }
    return { label, type };
  });

  const [skills, setSkills] = useState<{ label: string; type: 'required' | 'preferred' }[]>(() => parsedInitialSkills);
  const [newSkillText, setNewSkillText] = useState('');
  const [newSkillType, setNewSkillType] = useState<'required' | 'preferred'>('required');

  const initialCertifications = initialValues?.certifications ?? [];
  const parsedInitialCertifications = initialCertifications.map(cert => {
    let type: 'required' | 'preferred' = 'required';
    let label = cert;
    if (cert.endsWith('(Ưu tiên)')) {
      type = 'preferred';
      label = cert.replace(/\s*\(Ưu tiên\)/, '').trim();
    } else if (cert.endsWith('(Bắt buộc)')) {
      type = 'required';
      label = cert.replace(/\s*\(Bắt buộc\)/, '').trim();
    }
    return { label, type };
  });

  const [certs, setCerts] = useState<{ label: string; type: 'required' | 'preferred' }[]>(() => parsedInitialCertifications);
  const [newCertText, setNewCertText] = useState('');
  const [newCertType, setNewCertType] = useState<'required' | 'preferred'>('required');

  const handleAddSkill = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const cleaned = newSkillText.trim();
    if (!cleaned) return;
    
    if (skills.some(s => s.label.toLowerCase() === cleaned.toLowerCase())) {
      return;
    }
    
    setSkills([...skills, { label: cleaned, type: newSkillType }]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (label: string) => {
    setSkills(skills.filter(s => s.label !== label));
  };

  const serializedSkills = skills
    .map(s => `${s.label} (${s.type === 'required' ? 'Bắt buộc' : 'Ưu tiên'})`)
    .join(', ');

  const handleAddCert = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const cleaned = newCertText.trim();
    if (!cleaned) return;
    
    if (certs.some(c => c.label.toLowerCase() === cleaned.toLowerCase())) {
      return;
    }
    
    setCerts([...certs, { label: cleaned, type: newCertType }]);
    setNewCertText('');
  };

  const handleRemoveCert = (label: string) => {
    setCerts(certs.filter(c => c.label !== label));
  };

  const serializedCerts = certs
    .map(c => `${c.label} (${c.type === 'required' ? 'Bắt buộc' : 'Ưu tiên'})`)
    .join(', ');

  const activeEmploymentType = normalizeEmploymentType(initialValues?.employmentType);

  const handleFormAction = async (formData: FormData) => {
    await action(formData);
    toast.success('Lưu việc làm thành công!', {
      description: 'Dữ liệu đã được lưu vào database và đồng bộ vector (vectorize).'
    });
  };

  return (
    <form action={handleFormAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <input name="title" defaultValue={initialValues?.title ?? ''} className={inputClass} minLength={3} required />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Summary</span>
          <textarea name="summary" defaultValue={initialValues?.summary ?? ''} className={`min-h-28 ${textareaClass}`} minLength={10} required />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Requirements (one per line)</span>
          <textarea name="requirements" defaultValue={formatMultilineList(initialValues?.requirements)} className={`min-h-28 ${textareaClass}`} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Benefits (one per line)</span>
          <textarea name="benefits" defaultValue={formatMultilineList(initialValues?.benefits)} className={`min-h-24 ${textareaClass}`} />
        </label>

        {/* Interactive Skills section */}
        <div className="space-y-3 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700 block font-semibold">Yêu cầu kỹ năng (Skills)</span>
          
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nhập tên kỹ năng (VD: React, Node.js, Python...)"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="newSkillType"
                  checked={newSkillType === 'required'}
                  onChange={() => setNewSkillType('required')}
                  className="h-4 w-4 accent-zinc-900 cursor-pointer"
                />
                <span>Bắt buộc</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="newSkillType"
                  checked={newSkillType === 'preferred'}
                  onChange={() => setNewSkillType('preferred')}
                  className="h-4 w-4 accent-zinc-900 cursor-pointer"
                />
                <span>Ưu tiên</span>
              </label>
            </div>
            
            <button
              type="button"
              onClick={handleAddSkill}
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow active:scale-[0.98]"
            >
              Thêm (+)
            </button>
          </div>

          <input type="hidden" name="skills" value={serializedSkills} />

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Bắt buộc có ({skills.filter(s => s.type === 'required').length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.filter(s => s.type === 'required').length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">Chưa có kỹ năng bắt buộc</span>
                ) : (
                  skills.filter(s => s.type === 'required').map((s) => (
                    <span
                      key={s.label}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100"
                    >
                      {s.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.label)}
                        className="ml-1 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Ưu tiên có ({skills.filter(s => s.type === 'preferred').length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.filter(s => s.type === 'preferred').length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">Chưa có kỹ năng ưu tiên</span>
                ) : (
                  skills.filter(s => s.type === 'preferred').map((s) => (
                    <span
                      key={s.label}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100"
                    >
                      {s.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.label)}
                        className="ml-1 rounded-full p-0.5 text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Certifications section */}
        <div className="space-y-3 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700 block font-semibold">Yêu cầu chứng chỉ (Certifications)</span>
          
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nhập tên chứng chỉ (VD: AWS Certified, PMP, IELTS...)"
                value={newCertText}
                onChange={(e) => setNewCertText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCert(e);
                  }
                }}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="newCertType"
                  checked={newCertType === 'required'}
                  onChange={() => setNewCertType('required')}
                  className="h-4 w-4 accent-zinc-900 cursor-pointer"
                />
                <span>Bắt buộc</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="newCertType"
                  checked={newCertType === 'preferred'}
                  onChange={() => setNewCertType('preferred')}
                  className="h-4 w-4 accent-zinc-900 cursor-pointer"
                />
                <span>Ưu tiên</span>
              </label>
            </div>
            
            <button
              type="button"
              onClick={handleAddCert}
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow active:scale-[0.98]"
            >
              Thêm (+)
            </button>
          </div>

          <input type="hidden" name="certifications" value={serializedCerts} />

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Bắt buộc có ({certs.filter(c => c.type === 'required').length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {certs.filter(c => c.type === 'required').length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">Chưa có chứng chỉ bắt buộc</span>
                ) : (
                  certs.filter(c => c.type === 'required').map((c) => (
                    <span
                      key={c.label}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100"
                    >
                      {c.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(c.label)}
                        className="ml-1 rounded-full p-0.5 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                Ưu tiên có ({certs.filter(c => c.type === 'preferred').length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {certs.filter(c => c.type === 'preferred').length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">Chưa có chứng chỉ ưu tiên</span>
                ) : (
                  certs.filter(c => c.type === 'preferred').map((c) => (
                    <span
                      key={c.label}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                    >
                      {c.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(c.label)}
                        className="ml-1 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Type grid selection */}
        <div className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700 font-semibold block mb-2">Hình thức làm việc (Employment Type)</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: 'FULL_TIME', label: 'Toàn thời gian' },
              { value: 'PART_TIME', label: 'Bán thời gian' },
              { value: 'INTERN', label: 'Thực tập' },
              { value: 'OTHER', label: 'Khác' },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50/50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50 has-[:checked]:ring-1 has-[:checked]:ring-zinc-900"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-900">{opt.label}</span>
                  <span className="text-xs text-zinc-400 font-mono mt-0.5">{opt.value}</span>
                </div>
                <input
                  type="radio"
                  name="employmentType"
                  value={opt.value}
                  defaultChecked={activeEmploymentType === opt.value}
                  className="h-4 w-4 accent-zinc-900 cursor-pointer"
                  required
                />
              </label>
            ))}
          </div>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Min</span>
          <input type="number" name="salaryMin" defaultValue={initialValues?.salaryMin ?? ''} className={inputClass} min={0} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Max</span>
          <input type="number" name="salaryMax" defaultValue={initialValues?.salaryMax ?? ''} className={inputClass} min={0} />
        </label>
      </div>

      {/* Filter metadata section */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-200 p-4">
        <legend className="px-2 text-sm font-semibold text-zinc-700">Thông tin lọc việc làm</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Working Day Status */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Lịch làm việc</span>
            <select name="workingDayStatus" defaultValue={initialValues?.workingDayStatus ?? 'not_mentioned'} className={inputClass}>
              {WORKING_DAY_STATUS_VALUES.map((val) => (
                <option key={val} value={val}>{WORKING_DAY_STATUS_LABELS[val]}</option>
              ))}
            </select>
          </label>

          {/* Experience Level */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Kinh nghiệm</span>
            <select name="experienceLevel" defaultValue={initialValues?.experienceLevel ?? ''} className={inputClass}>
              <option value="">Không yêu cầu</option>
              {EXPERIENCE_LEVEL_VALUES.filter((v) => v !== 'no_required').map((val) => (
                <option key={val} value={val}>{EXPERIENCE_LEVEL_LABELS[val]}</option>
              ))}
            </select>
          </label>

          {/* Job Level */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Cấp bậc</span>
            <select name="jobLevel" defaultValue={initialValues?.jobLevel ?? ''} className={inputClass}>
              <option value="">-- Chọn --</option>
              {JOB_LEVEL_VALUES.map((val) => (
                <option key={val} value={val}>{JOB_LEVEL_LABELS[val]}</option>
              ))}
            </select>
          </label>

          {/* Employment Type is handled in the main section */}

          {/* Sales Model */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Hình thức kinh doanh</span>
            <select name="salesModel" defaultValue={initialValues?.salesModel ?? ''} className={inputClass}>
              <option value="">-- Chọn --</option>
              {SALES_MODEL_VALUES.map((val) => (
                <option key={val} value={val}>{SALES_MODEL_LABELS[val]}</option>
              ))}
            </select>
          </label>

          {/* Application Deadline */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Hạn nộp hồ sơ</span>
            <input type="date" name="applicationDeadline" defaultValue={initialValues?.applicationDeadline ?? ''} className={inputClass} />
          </label>

          {/* Salary Negotiable */}
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="salaryNegotiable" defaultChecked={initialValues?.salaryNegotiable ?? false} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium text-zinc-700">Lương thỏa thuận</span>
          </label>

          {/* Customer Types */}
          <div className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Đối tượng khách hàng</span>
            <div className="flex flex-wrap gap-4">
              {CUSTOMER_TYPE_VALUES.map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="customerTypes"
                    value={type}
                    defaultChecked={initialValues?.customerTypes?.includes(type)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm text-zinc-600">{CUSTOMER_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <PendingButton type="submit" pendingText="Đang lưu...">{submitLabel}</PendingButton>
    </form>
  );
}
