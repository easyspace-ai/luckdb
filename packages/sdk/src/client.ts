import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ClientConfig, APIResponse } from './types';

export class LuckDBClient {
  private http: AxiosInstance;

  constructor(config: ClientConfig) {
    this.http = axios.create({
      baseURL: config.baseURL || 'http://localhost:8080',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // 请求拦截器
    this.http.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.http.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          const apiError = error.response.data as APIResponse<null>;
          return Promise.reject(new Error(apiError.message || 'Request failed'));
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('luckdb_token');
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('luckdb_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('luckdb_token');
    }
  }

  async request<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.http.request({ url, ...config });
  }

  // Tables API
  tables = {
    list: () => this.request('/api/v1/tables'),
    get: (id: string) => this.request(`/api/v1/tables/${id}`),
    create: (data: any) => this.request('/api/v1/tables', { method: 'POST', data }),
    update: (id: string, data: any) =>
      this.request(`/api/v1/tables/${id}`, { method: 'PUT', data }),
    delete: (id: string) => this.request(`/api/v1/tables/${id}`, { method: 'DELETE' }),
  };

  // Records API
  records = {
    list: (tableId: string, params?: any) =>
      this.request(`/api/v1/tables/${tableId}/records`, { params }),
    get: (tableId: string, recordId: string) =>
      this.request(`/api/v1/tables/${tableId}/records/${recordId}`),
    create: (tableId: string, data: any) =>
      this.request(`/api/v1/tables/${tableId}/records`, { method: 'POST', data }),
    update: (tableId: string, recordId: string, data: any) =>
      this.request(`/api/v1/tables/${tableId}/records/${recordId}`, { method: 'PUT', data }),
    delete: (tableId: string, recordId: string) =>
      this.request(`/api/v1/tables/${tableId}/records/${recordId}`, { method: 'DELETE' }),
  };

  // Views API
  views = {
    list: (tableId: string) => this.request(`/api/v1/tables/${tableId}/views`),
    get: (viewId: string) => this.request(`/api/v1/views/${viewId}`),
    create: (tableId: string, data: any) =>
      this.request(`/api/v1/tables/${tableId}/views`, { method: 'POST', data }),
    update: (viewId: string, data: any) =>
      this.request(`/api/v1/views/${viewId}`, { method: 'PUT', data }),
    delete: (viewId: string) => this.request(`/api/v1/views/${viewId}`, { method: 'DELETE' }),
  };

  // Auth API
  auth = {
    login: (email: string, password: string) =>
      this.request('/api/v1/auth/login', { method: 'POST', data: { email, password } }),
    register: (data: any) => this.request('/api/v1/auth/register', { method: 'POST', data }),
    logout: () => this.request('/api/v1/auth/logout', { method: 'POST' }),
    me: () => this.request('/api/v1/auth/me'),
  };
}

