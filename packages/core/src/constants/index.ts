export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'luckdb_token',
  USER_PREFERENCES: 'luckdb_preferences',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TABLES: '/tables',
  TABLE: (id: string) => `/tables/${id}`,
  VIEWS: '/views',
  SETTINGS: '/settings',
} as const;

