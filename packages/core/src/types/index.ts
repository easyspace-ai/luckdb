/**
 * Core types for LuckDB
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Table {
  id: string;
  name: string;
  description?: string;
}

export interface Base {
  id: string;
  name: string;
  description?: string;
  tables: Table[];
}
