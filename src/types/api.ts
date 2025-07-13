export interface ResponseData<T> {
  success: boolean;
  message: string;
  data?: T | null;
}

export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[];
  error_type?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  requestId?: string;
}
