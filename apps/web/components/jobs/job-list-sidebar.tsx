'use client';

import { useState } from 'react';
import type { JobListFilters } from './job-list-client';
import { SCCBrandLogo } from '@/components/layout/brand-mark';

type JobListSidebarProps = {
  filters: JobListFilters;
  onFilterChange: (filters: JobListFilters) => void;
};

const CATEGORY_OPTIONS = [
  { value: 'sales', label: 'Sales Bán lẻ/Dịch vụ tiêu dùng', count: 2274 },
  { value: 'kinh-doanh', label: 'Kinh doanh/Bán hàng khác', count: 2042 },
  { value: 'sales-admin', label: 'Sales Admin/Sales Support', count: 1358 },
  { value: 'quan-ly', label: 'Quản lý kinh doanh', count: 1331 },
  { value: 'giao-duc', label: 'Sales Giáo dục/Khoá học', count: 1251 },
  { value: 'bat-dong-san', label: 'Sales Bất động sản', count: 980 },
  { value: 'it', label: 'IT/Phần mềm', count: 1842 },
  { value: 'marketing', label: 'Marketing/Truyền thông', count: 1156 },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'direct-sales', label: 'Direct Sales' },
  { value: 'telesales', label: 'Telesales' },
  { value: 'online-sales', label: 'Online Sales' },
  { value: 'showroom', label: 'Bán hàng tại cửa hàng/showroom' },
];

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'b2b', label: 'B2B' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2g', label: 'B2G' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'none', label: 'Không yêu cầu' },
  { value: 'under-1', label: 'Dưới 1 năm' },
  { value: '1-year', label: '1 năm' },
  { value: '2-year', label: '2 năm' },
  { value: '3-year', label: '3 năm' },
];

export function JobListSidebar({ filters, onFilterChange }: JobListSidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = showAllCategories
    ? CATEGORY_OPTIONS
    : CATEGORY_OPTIONS.slice(0, 5);

  const handleCategoryToggle = (value: string) => {
    const newCategories = filters.categories.includes(value)
      ? filters.categories.filter((c) => c !== value)
      : [...filters.categories, value];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleRadioChange = (
    field: 'businessType' | 'customerType' | 'experience',
    value: string,
  ) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFilterChange({
      categories: [],
      businessType: 'all',
      customerType: 'all',
      experience: 'all',
      keyword: filters.keyword,
    });
  };

  return (
    <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SCCBrandLogo iconClassName="h-8 w-8" textClassName="text-sm" />
          <span className="rounded bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">SalesHub</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="filter-section">
        <h4 className="mb-3 text-sm font-bold text-slate-800">
          Lọc theo danh mục nghề
        </h4>
        <div className="space-y-2.5">
          {visibleCategories.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={filters.categories.includes(option.value)}
                onChange={() => handleCategoryToggle(option.value)}
              />
              <span className="flex-1">{option.label}</span>
              <span className="text-xs text-gray-400">({option.count.toLocaleString('vi-VN')})</span>
            </label>
          ))}
        </div>
        <button
          className="mt-2 text-sm font-semibold text-primary-600 hover:underline"
          type="button"
          onClick={() => setShowAllCategories(!showAllCategories)}
        >
          {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
        </button>
      </div>

      {/* Business type filter */}
      <div className="filter-section">
        <h4 className="mb-3 text-sm font-bold text-slate-800">
          Hình thức kinh doanh
        </h4>
        <div className="space-y-2.5">
          {BUSINESS_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800"
            >
              <input
                type="radio"
                name="businessType"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={filters.businessType === option.value}
                onChange={() => handleRadioChange('businessType', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Customer type filter */}
      <div className="filter-section">
        <h4 className="mb-3 text-sm font-bold text-slate-800">
          Đối tượng khách hàng
        </h4>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-slate-800"
            >
              <input
                type="radio"
                name="customerType"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={filters.customerType === option.value}
                onChange={() => handleRadioChange('customerType', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Experience filter */}
      <div className="filter-section">
        <h4 className="mb-3 text-sm font-bold text-slate-800">Kinh nghiệm</h4>
        <div className="space-y-2.5">
          {EXPERIENCE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-slate-800"
            >
              <input
                type="radio"
                name="experience"
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={filters.experience === option.value}
                onChange={() => handleRadioChange('experience', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:border-red-300 hover:text-red-500"
        type="button"
        onClick={handleReset}
      >
        <i className="fa-solid fa-rotate-left text-xs" />
        Xóa lọc
      </button>
    </div>
  );
}
