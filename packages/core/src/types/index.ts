export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  id: string;
  name: string;
  type: string;
  tableId: string;
  config?: Record<string, any>;
}

export interface Record {
  id: string;
  tableId: string;
  fields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface View {
  id: string;
  name: string;
  type: 'grid' | 'kanban' | 'calendar' | 'gallery';
  tableId: string;
  config?: Record<string, any>;
}

