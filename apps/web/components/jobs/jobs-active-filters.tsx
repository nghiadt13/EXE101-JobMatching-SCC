'use client';

import type { JobsQuery, JobsListResponse } from '@/lib/jobs-client';
import {
  EXPERIENCE_LEVEL_LABELS,
  SALARY_BAND_LABELS,
  JOB_LEVEL_LABELS,
  SALES_MODEL_LABELS,
  CUSTOMER_TYPE_LABELS,
  COMPANY_TYPE_LABELS,
  WORKING_DAY_STATUS_LABELS,
} from '@/lib/job-filter-options';

type Props = {
  query: JobsQuery;
  facets?: JobsListResponse['facets'] | null;
  onRemove?: (key: string, value?: string) => void;
  onClearAll?: () => void;
};

const noop = () => {};

export function JobsActiveFilters({ query, onRemove = noop, onClearAll = noop }: Props) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (query.categorySlugs?.length) {
    for (const slug of query.categorySlugs) {
      chips.push({
        key: `cat-${slug}`,
        label: slug,
        onRemove: () => onRemove('categorySlugs', slug),
      });
    }
  }

  if (query.experienceLevels?.length) {
    for (const level of query.experienceLevels) {
      chips.push({
        key: `exp-${level}`,
        label: EXPERIENCE_LEVEL_LABELS[level as keyof typeof EXPERIENCE_LEVEL_LABELS] ?? level,
        onRemove: () => onRemove('experienceLevels', level),
      });
    }
  }

  if (query.salaryBands?.length) {
    for (const band of query.salaryBands) {
      chips.push({
        key: `sal-${band}`,
        label: SALARY_BAND_LABELS[band as keyof typeof SALARY_BAND_LABELS] ?? band,
        onRemove: () => onRemove('salaryBands', band),
      });
    }
  }

  if (query.jobLevels?.length) {
    for (const level of query.jobLevels) {
      chips.push({
        key: `lvl-${level}`,
        label: JOB_LEVEL_LABELS[level as keyof typeof JOB_LEVEL_LABELS] ?? level,
        onRemove: () => onRemove('jobLevels', level),
      });
    }
  }

  if (query.salesModels?.length) {
    for (const model of query.salesModels) {
      chips.push({
        key: `sales-${model}`,
        label: SALES_MODEL_LABELS[model as keyof typeof SALES_MODEL_LABELS] ?? model,
        onRemove: () => onRemove('salesModels', model),
      });
    }
  }

  if (query.customerTypes?.length) {
    for (const type of query.customerTypes) {
      chips.push({
        key: `cust-${type}`,
        label: CUSTOMER_TYPE_LABELS[type as keyof typeof CUSTOMER_TYPE_LABELS] ?? type,
        onRemove: () => onRemove('customerTypes', type),
      });
    }
  }

  if (query.workingDayStatus) {
    chips.push({
      key: 'workingDay',
      label: WORKING_DAY_STATUS_LABELS[query.workingDayStatus as keyof typeof WORKING_DAY_STATUS_LABELS] ?? query.workingDayStatus,
      onRemove: () => onRemove('workingDayStatus'),
    });
  }

  if (query.companyTypes?.length) {
    for (const type of query.companyTypes) {
      chips.push({
        key: `company-${type}`,
        label: COMPANY_TYPE_LABELS[type as keyof typeof COMPANY_TYPE_LABELS] ?? type,
        onRemove: () => onRemove('companyTypes', type),
      });
    }
  }

  if (query.employmentTypes?.length) {
    for (const type of query.employmentTypes) {
      chips.push({
        key: `emp-${type}`,
        label: type,
        onRemove: () => onRemove('employmentTypes', type),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">Đang lọc:</span>
      {chips.map(chip => (
        <button
          key={chip.key}
          className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          type="button"
          onClick={chip.onRemove}
        >
          {chip.label}
          <i className="fa-solid fa-xmark text-[10px]" />
        </button>
      ))}
      <button
        className="text-xs font-semibold text-red-500 hover:underline"
        type="button"
        onClick={onClearAll}
      >
        Xóa tất cả
      </button>
    </div>
  );
}
