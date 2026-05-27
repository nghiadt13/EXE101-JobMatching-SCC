/** Shared filter option constants for the web app */

export const WORKING_DAY_STATUS_VALUES = ['saturday_working', 'saturday_off', 'not_mentioned'] as const;
export type WorkingDayStatus = (typeof WORKING_DAY_STATUS_VALUES)[number];

export const WORKING_DAY_STATUS_LABELS: Record<WorkingDayStatus, string> = {
  saturday_working: 'Làm thứ 7',
  saturday_off: 'Nghỉ thứ 7',
  not_mentioned: 'Không đề cập',
};

export const EXPERIENCE_LEVEL_VALUES = ['no_required', 'under_1', '1', '2', '3', '4', '5', 'over_5'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];

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

export const JOB_LEVEL_VALUES = ['staff', 'leader', 'manager', 'director', 'intern', 'vice_president', 'branch_manager'] as const;
export type JobLevel = (typeof JOB_LEVEL_VALUES)[number];

export const JOB_LEVEL_LABELS: Record<JobLevel, string> = {
  staff: 'Nhân viên',
  leader: 'Trưởng nhóm',
  manager: 'Quản lý/Giám sát',
  director: 'Giám đốc',
  intern: 'Thực tập sinh',
  vice_president: 'Trưởng/Phó phòng',
  branch_manager: 'Trưởng chi nhánh',
};

export const SALES_MODEL_VALUES = ['direct_sales', 'telesales', 'online_sales', 'showroom'] as const;
export type SalesModel = (typeof SALES_MODEL_VALUES)[number];

export const SALES_MODEL_LABELS: Record<SalesModel, string> = {
  direct_sales: 'Direct Sales',
  telesales: 'Telesales',
  online_sales: 'Online Sales',
  showroom: 'Bán hàng tại cửa hàng/showroom',
};

export const CUSTOMER_TYPE_VALUES = ['b2b', 'b2c', 'b2g'] as const;
export type CustomerType = (typeof CUSTOMER_TYPE_VALUES)[number];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
  b2g: 'B2G',
};

export const SALARY_BAND_VALUES = [
  'under_10m', '10_15m', '15_20m', '20_30m', '30_50m', 'over_50m', 'negotiable',
] as const;
export type SalaryBand = (typeof SALARY_BAND_VALUES)[number];

export const SALARY_BAND_LABELS: Record<SalaryBand, string> = {
  under_10m: 'Dưới 10 triệu',
  '10_15m': '10 - 15 triệu',
  '15_20m': '15 - 20 triệu',
  '20_30m': '20 - 30 triệu',
  '30_50m': '30 - 50 triệu',
  over_50m: 'Trên 50 triệu',
  negotiable: 'Thỏa thuận',
};

export const COMPANY_TYPE_VALUES = ['normal', 'pro'] as const;
export type CompanyType = (typeof COMPANY_TYPE_VALUES)[number];

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  normal: 'Công ty thường',
  pro: 'Công ty Pro',
};
