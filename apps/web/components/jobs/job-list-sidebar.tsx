'use client';

import { useState } from 'react';
import type { JobsQuery, JobsListResponse } from '@/lib/jobs-client';
import {
  WORKING_DAY_STATUS_LABELS,
  WORKING_DAY_STATUS_VALUES,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVEL_VALUES,
  JOB_LEVEL_LABELS,
  JOB_LEVEL_VALUES,
  SALARY_BAND_LABELS,
  SALARY_BAND_VALUES,
  type WorkingDayStatus,
  type ExperienceLevel,
  type JobLevel,
  type SalaryBand,
} from '@/lib/job-filter-options';

type JobListSidebarProps = {
  query: JobsQuery;
  facets: JobsListResponse['facets'] | null;
  onFilterChange: (filterKey: string, values: string[] | string | undefined) => void;
  onClearAll: () => void;
};

const CATEGORY_SHOW_LIMIT = 5;

function withCountValues<T extends string>(
  values: readonly T[],
  counts?: Array<{ value: string; count: number }>,
) {
  return values.map((value) => ({
    value,
    count: counts?.find((entry) => entry.value === value)?.count ?? 0,
  }));
}

export function JobListSidebar({ query, facets, onFilterChange, onClearAll }: JobListSidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [showAllJobLevels, setShowAllJobLevels] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);

  const categories = facets?.categories ?? [];
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORY_SHOW_LIMIT);

  const workingDayStatuses = withCountValues(WORKING_DAY_STATUS_VALUES, facets?.workingDayStatus);
  const experienceLevels = withCountValues(EXPERIENCE_LEVEL_VALUES, facets?.experienceLevels);
  const companyIndustryKeys = facets?.companyIndustryKeys ?? [];
  const salaryBands = withCountValues(SALARY_BAND_VALUES, facets?.salaryBands);
  const jobLevels = withCountValues(JOB_LEVEL_VALUES, facets?.jobLevels);
  const employmentTypes = facets?.employmentTypes ?? [];

  const handleMultiToggle = (filterKey: string, value: string) => {
    const current = (query[filterKey as keyof JobsQuery] as string[] | undefined) ?? [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange(filterKey, next.length > 0 ? next : undefined);
  };

  const handleRadio = (filterKey: string, value: string) => {
    onFilterChange(filterKey, value);
  };

  return (
    <div className="job-filter-panel sticky top-[160px] max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-6 custom-scrollbar">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-100 text-primary-700">
          <i className="fa-solid fa-tags text-xs" />
        </span>
        <span className="text-base font-bold text-slate-700">SCC <span className="text-primary-600">JobsHub</span></span>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="filter-section border-b border-gray-200 pb-4 pt-2">
            <h4 className="mb-3 text-sm font-bold text-slate-800">Danh mục ngành nghề</h4>
            <div className="space-y-2.5">
              {visibleCategories.map(facet => (
                <label key={facet.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={query.categorySlugs?.includes(facet.value) ?? false}
                    onChange={() => handleMultiToggle('categorySlugs', facet.value)}
                  />
                  <span className="flex-1">{facet.label}</span>
                  <span className="text-xs text-gray-400">({facet.count.toLocaleString('vi-VN')})</span>
                </label>
              ))}
            </div>
            {categories.length > CATEGORY_SHOW_LIMIT ? (
              <button
                className="mt-2 text-sm font-semibold text-primary-600 hover:underline"
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
              </button>
            ) : null}
        </div>
      )}

      {/* Salary bands */}
      <div className="filter-section border-b border-gray-200 py-4">
          <h4 className="mb-3 text-sm font-bold text-slate-800">Mức lương</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="radio"
                name="salaryBandAll"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={!query.salaryBands?.length}
                onChange={() => onFilterChange('salaryBands', undefined)}
              />
              Tất cả
            </label>
            {salaryBands.map(facet => (
              <label key={facet.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
                <input
                  type="radio"
                  name="salaryBand"
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={query.salaryBands?.includes(facet.value) ?? false}
                  onChange={() => onFilterChange('salaryBands', [facet.value])}
                />
                <span>{SALARY_BAND_LABELS[facet.value as SalaryBand] ?? facet.value}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input className="h-8 w-20 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-400" disabled placeholder="Từ" />
            <span className="text-xs text-gray-300">-</span>
            <input className="h-8 w-20 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-400" disabled placeholder="Đến" />
            <span className="text-xs text-gray-400">triệu</span>
          </div>
      </div>

      {/* Experience */}
      {experienceLevels.length > 0 && (
        <div className="filter-section border-b border-gray-200 py-4">
          <h4 className="mb-3 text-sm font-bold text-slate-800">Kinh nghiệm</h4>
          <div className="space-y-2.5">
            {(showAllExperience ? experienceLevels : experienceLevels.slice(0, 5)).map(facet => (
              <label key={facet.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={query.experienceLevels?.includes(facet.value) ?? false}
                  onChange={() => handleMultiToggle('experienceLevels', facet.value)}
                />
                <span className="flex-1">{EXPERIENCE_LEVEL_LABELS[facet.value as ExperienceLevel] ?? facet.value}</span>
                <span className="text-xs text-gray-400">({facet.count.toLocaleString('vi-VN')})</span>
              </label>
            ))}
          </div>
          {experienceLevels.length > 5 && (
            <button className="mt-2 text-sm font-semibold text-primary-600 hover:underline" type="button" onClick={() => setShowAllExperience(!showAllExperience)}>
              {showAllExperience ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Job levels */}
      {jobLevels.length > 0 && (
        <div className="filter-section border-b border-gray-200 py-4">
          <h4 className="mb-3 text-sm font-bold text-slate-800">Cấp bậc</h4>
          <div className="space-y-2.5">
            {(showAllJobLevels ? jobLevels : jobLevels.slice(0, 5)).map(facet => (
              <label key={facet.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={query.jobLevels?.includes(facet.value) ?? false}
                  onChange={() => handleMultiToggle('jobLevels', facet.value)}
                />
                <span className="flex-1">{JOB_LEVEL_LABELS[facet.value as JobLevel] ?? facet.value}</span>
                <span className="text-xs text-gray-400">({facet.count.toLocaleString('vi-VN')})</span>
              </label>
            ))}
          </div>
          {jobLevels.length > 5 && (
            <button className="mt-2 text-sm font-semibold text-primary-600 hover:underline" type="button" onClick={() => setShowAllJobLevels(!showAllJobLevels)}>
              {showAllJobLevels ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Employment types */}
      {employmentTypes.length > 0 && (
        <div className="filter-section border-b border-gray-200 py-4">
          <h4 className="mb-3 text-sm font-bold text-slate-800">Hình thức làm việc</h4>
          <div className="space-y-2.5">
            {employmentTypes.map(facet => (
              <label key={facet.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={query.employmentTypes?.includes(facet.value) ?? false}
                  onChange={() => handleMultiToggle('employmentTypes', facet.value)}
                />
                <span className="flex-1">{facet.value}</span>
                <span className="text-xs text-gray-400">({facet.count.toLocaleString('vi-VN')})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Company industries */}
      {companyIndustryKeys.length > 0 && (
        <div className="filter-section border-b border-gray-200 py-4">
          <h4 className="mb-3 text-sm font-bold text-slate-800">Lĩnh vực công ty</h4>
          <div className="space-y-2.5">
            {(showAllIndustries ? companyIndustryKeys : companyIndustryKeys.slice(0, 5)).map(facet => (
              <label key={facet.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={query.companyIndustryKeys?.includes(facet.value) ?? false}
                  onChange={() => handleMultiToggle('companyIndustryKeys', facet.value)}
                />
                <span className="flex-1">{facet.value}</span>
                <span className="text-xs text-gray-400">({facet.count.toLocaleString('vi-VN')})</span>
              </label>
            ))}
          </div>
          {companyIndustryKeys.length > 5 && (
            <button className="mt-2 text-sm font-semibold text-primary-600 hover:underline" type="button" onClick={() => setShowAllIndustries(!showAllIndustries)}>
              {showAllIndustries ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Working day status */}
      <div className="filter-section py-4">
        <h4 className="mb-3 text-sm font-bold text-slate-800">Thời gian làm việc</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="radio"
              name="workingDayStatus"
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={!query.workingDayStatus}
              onChange={() => onFilterChange('workingDayStatus', undefined)}
            />
            Tất cả
          </label>
          {workingDayStatuses.map(facet => (
            <label key={facet.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
              <input
                type="radio"
                name="workingDayStatus"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={query.workingDayStatus === facet.value}
                onChange={() => handleRadio('workingDayStatus', facet.value)}
              />
              {WORKING_DAY_STATUS_LABELS[facet.value as WorkingDayStatus] ?? facet.value}
            </label>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:border-red-300 hover:text-red-500"
        type="button"
        onClick={onClearAll}
      >
        <i className="fa-solid fa-rotate-left text-xs" />
        Xóa lọc
      </button>
    </div>
  );
}
