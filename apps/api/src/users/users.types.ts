import { UserRole } from '@prisma/client';

export interface UserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UsersListResponse {
  items: UserView[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AdminUserCvView {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  source: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface AdminTransactionView {
  id: string;
  amount: number;
  planName: string | null;
  orderCode: string;
  status: string;
  paymentMethod: string;
  createdAt: Date;
}

export interface AdminUserDetailResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  planName: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  totalUsageDays: number;
  cvs: AdminUserCvView[];
  transactions: AdminTransactionView[];
}
