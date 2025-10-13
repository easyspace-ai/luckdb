export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface APIResponse<T> {
  code: number;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  request_id?: string;
  timestamp?: string;
  duration_ms?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: PaginationMeta;
}

