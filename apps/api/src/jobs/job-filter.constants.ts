// Working day status options
export const WORKING_DAY_STATUS_VALUES = [
  'saturday_working',
  'saturday_off',
  'not_mentioned',
] as const;
export type WorkingDayStatus = (typeof WORKING_DAY_STATUS_VALUES)[number];

// Experience level options
export const EXPERIENCE_LEVEL_VALUES = [
  'no_required',
  'under_1',
  '1',
  '2',
  '3',
  '4',
  '5',
  'over_5',
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];

// Salary band options
export const SALARY_BAND_VALUES = [
  'under_10',
  '10_15',
  '15_20',
  '20_30',
  '30_50',
  'over_50',
  'negotiable',
] as const;
export type SalaryBand = (typeof SALARY_BAND_VALUES)[number];

// Job level options
export const JOB_LEVEL_VALUES = [
  'staff',
  'leader',
  'manager',
  'director',
  'intern',
  'vice_president',
  'branch_manager',
] as const;
export type JobLevel = (typeof JOB_LEVEL_VALUES)[number];

// Sales model options
export const SALES_MODEL_VALUES = [
  'direct_sales',
  'telesales',
  'online_sales',
  'showroom',
] as const;
export type SalesModel = (typeof SALES_MODEL_VALUES)[number];

// Customer type options
export const CUSTOMER_TYPE_VALUES = ['b2b', 'b2c', 'b2g'] as const;
export type CustomerType = (typeof CUSTOMER_TYPE_VALUES)[number];

// Company type options
export const COMPANY_TYPE_VALUES = ['normal', 'pro'] as const;
export type CompanyType = (typeof COMPANY_TYPE_VALUES)[number];

// Company industry keys (sample)
export const COMPANY_INDUSTRY_KEYS = [
  'it_software',
  'finance',
  'education',
  'healthcare',
  'manufacturing',
  'retail',
  'consulting',
  'media',
  'logistics',
  'real_estate',
  'hospitality',
  'agriculture',
  'construction',
  'energy',
  'telecom',
] as const;

// Job field keys (sample)
export const JOB_FIELD_KEYS = [
  'sales',
  'marketing',
  'hr',
  'finance',
  'it',
  'engineering',
  'design',
  'customer_service',
  'operations',
  'legal',
  'administration',
  'research',
  'product',
  'data',
  'security',
] as const;

// Search scope options
export const SEARCH_SCOPE_VALUES = ['job', 'company', 'both'] as const;
export type SearchScope = (typeof SEARCH_SCOPE_VALUES)[number];

// Salary band range mapping (in VND)
// Upper bound is exclusive to prevent double-counting at exact boundaries
export const SALARY_BAND_RANGES: Record<
  SalaryBand,
  { min?: number; maxExclusive?: number }
> = {
  under_10: { maxExclusive: 10_000_000 },
  '10_15': { min: 10_000_000, maxExclusive: 15_000_000 },
  '15_20': { min: 15_000_000, maxExclusive: 20_000_000 },
  '20_30': { min: 20_000_000, maxExclusive: 30_000_000 },
  '30_50': { min: 30_000_000, maxExclusive: 50_000_000 },
  over_50: { min: 50_000_000 },
  negotiable: {},
};

// Label maps for Vietnamese display
export const WORKING_DAY_STATUS_LABELS: Record<WorkingDayStatus, string> = {
  saturday_working: 'Làm thứ 7',
  saturday_off: 'Nghỉ thứ 7',
  not_mentioned: 'Tin đăng không đề cập',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  no_required: 'Không yêu cầu',
  under_1: 'Dưới 1 năm',
  '1': '1 năm',
  '2': '2 năm',
  '3': '3 năm',
  '4': '4 năm',
  '5': '5 năm',
  over_5: 'Trên 5 năm',
};

export const SALARY_BAND_LABELS: Record<SalaryBand, string> = {
  under_10: 'Dưới 10 triệu',
  '10_15': '10 – 15 triệu',
  '15_20': '15 – 20 triệu',
  '20_30': '20 – 30 triệu',
  '30_50': '30 – 50 triệu',
  over_50: 'Trên 50 triệu',
  negotiable: 'Thỏa thuận',
};

export const JOB_LEVEL_LABELS: Record<JobLevel, string> = {
  staff: 'Nhân viên',
  leader: 'Trưởng nhóm',
  manager: 'Quản lý/Giám sát',
  director: 'Giám đốc',
  intern: 'Thực tập sinh',
  vice_president: 'Trưởng/Phó phòng',
  branch_manager: 'Trưởng chi nhánh',
};

export const SALES_MODEL_LABELS: Record<SalesModel, string> = {
  direct_sales: 'Direct Sales',
  telesales: 'Telesales',
  online_sales: 'Online Sales',
  showroom: 'Bán hàng tại cửa hàng/showroom',
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
  b2g: 'B2G',
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  normal: 'Tất cả',
  pro: 'Pro Company',
};
