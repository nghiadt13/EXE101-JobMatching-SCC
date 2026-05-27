import { Button } from '@/components/ui/button';
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

export function RecruiterJobForm({ submitLabel, action, initialValues }: RecruiterJobFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Skills (comma separated)</span>
          <input name="skills" defaultValue={initialValues?.skills?.join(', ') ?? ''} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Employment Type</span>
          <input name="employmentType" defaultValue={initialValues?.employmentType ?? 'FULL_TIME'} className={inputClass} required />
        </label>
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

          {/* Employment Type */}
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Hình thức làm việc</span>
            <select name="employmentType" defaultValue={initialValues?.employmentType ?? 'FULL_TIME'} className={inputClass}>
              <option value="FULL_TIME">Toàn thời gian</option>
              <option value="PART_TIME">Bán thời gian</option>
              <option value="INTERN">Thực tập</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>

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

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
