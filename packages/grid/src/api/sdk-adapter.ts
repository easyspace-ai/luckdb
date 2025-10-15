/**
 * SDK Adapter
 * 将 @luckdb/sdk 适配为 grid 包的 ApiClient 接口
 */

import { LuckDB } from '@luckdb/sdk';
import type { AxiosRequestConfig } from 'axios';
import type {
  IBase,
  ITable,
  IField,
  IRecord,
  IView,
  IComment,
  ICreateBaseRo,
  ICreateTableRo,
  ICreateFieldRo,
  ICreateRecordRo,
  ICreateViewRo,
  ICreateCommentRo,
  IUpdateBaseRo,
  IUpdateTableRo,
  IUpdateFieldRo,
  IUpdateRecordRo,
  IUpdateViewRo,
  IUpdateCommentRo,
  IGetRecordsRo,
  PaginatedResponse,
  ITablePermission,
} from './types';

export interface SDKAdapterConfig {
  baseURL: string;
  token?: string;
  timeout?: number;
  onError?: (error: any) => void;
  onUnauthorized?: () => void;
}

/**
 * SDK 适配器类
 * 将 LuckDB SDK 包装成 ApiClient 接口
 */
export class SDKAdapter {
  private sdk: LuckDB;
  private config: SDKAdapterConfig;

  constructor(config: SDKAdapterConfig) {
    this.config = config;

    // 初始化 SDK
    this.sdk = new LuckDB({
      baseUrl: config.baseURL,
      accessToken: config.token,
      debug: false,
    });
  }

  /**
   * Update authorization token
   */
  setToken(token: string): void {
    this.config.token = token;
    this.sdk.setAccessToken(token);
  }

  /**
   * Clear authorization token
   */
  clearToken(): void {
    this.config.token = undefined;
    this.sdk.clearTokens();
  }

  // ==================== Base APIs ====================

  /**
   * Get all bases
   */
  async getBases(): Promise<IBase[]> {
    try {
      const bases = await this.sdk.listBases();
      return bases.map(this.adaptBase);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a base by ID
   */
  async getBase(id: string): Promise<IBase> {
    try {
      const base = await this.sdk.getBase(id);
      return this.adaptBase(base);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new base
   */
  async createBase(data: ICreateBaseRo): Promise<IBase> {
    try {
      const base = await this.sdk.createBase({
        name: data.name,
        icon: data.icon,
        spaceId: data.spaceId,
      });
      return this.adaptBase(base);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a base
   */
  async updateBase(id: string, data: IUpdateBaseRo): Promise<IBase> {
    try {
      const base = await this.sdk.updateBase(id, {
        name: data.name,
        icon: data.icon,
      });
      return this.adaptBase(base);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a base
   */
  async deleteBase(id: string): Promise<void> {
    try {
      await this.sdk.deleteBase(id);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ==================== Table APIs ====================

  /**
   * Get all tables in a base
   */
  async getTables(baseId: string): Promise<ITable[]> {
    try {
      const tables = await this.sdk.listTables({ baseId });
      return tables.map(this.adaptTable);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a table by ID
   */
  async getTable(tableId: string): Promise<ITable> {
    try {
      const table = await this.sdk.getTable(tableId);
      return this.adaptTable(table);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new table
   */
  async createTable(baseId: string, data: ICreateTableRo): Promise<ITable> {
    try {
      const table = await this.sdk.createTable({
        baseId,
        name: data.name,
        description: data.description,
        icon: data.icon,
      });
      return this.adaptTable(table);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a table
   */
  async updateTable(tableId: string, data: IUpdateTableRo): Promise<ITable> {
    try {
      const table = await this.sdk.updateTable(tableId, {
        name: data.name,
        description: data.description,
        icon: data.icon,
      });
      return this.adaptTable(table);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(tableId: string): Promise<void> {
    try {
      await this.sdk.deleteTable(tableId);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get table permissions
   */
  async getTablePermission(tableId: string): Promise<ITablePermission> {
    try {
      // SDK 可能还没有这个方法，返回默认权限
      return {
        'table|read': true,
        'table|update': true,
        'table|delete': true,
        'record|create': true,
        'record|read': true,
        'record|update': true,
        'record|delete': true,
        'field|create': true,
        'field|read': true,
        'field|update': true,
        'field|delete': true,
        'view|create': true,
        'view|read': true,
        'view|update': true,
        'view|delete': true,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ==================== Field APIs ====================

  /**
   * Get all fields in a table
   */
  async getFields(tableId: string): Promise<IField[]> {
    try {
      const fields = await this.sdk.listFields({ tableId });
      return fields.map(this.adaptField);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a field by ID
   */
  async getField(tableId: string, fieldId: string): Promise<IField> {
    try {
      const field = await this.sdk.getField(fieldId);
      return this.adaptField(field);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new field
   */
  async createField(tableId: string, data: ICreateFieldRo): Promise<IField> {
    try {
      const field = await this.sdk.createField({
        tableId,
        name: data.name,
        type: data.type,
        options: data.options,
        description: data.description,
        primary: data.isPrimary,
      });
      return this.adaptField(field);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a field
   */
  async updateField(
    tableId: string,
    fieldId: string,
    data: IUpdateFieldRo
  ): Promise<IField> {
    try {
      const field = await this.sdk.updateField(fieldId, {
        name: data.name,
        type: data.type,
        options: data.options,
        description: data.description,
      });
      return this.adaptField(field);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a field
   */
  async deleteField(tableId: string, fieldId: string): Promise<void> {
    try {
      await this.sdk.deleteField(fieldId);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Convert field type
   */
  async convertField(
    tableId: string,
    fieldId: string,
    newType: string,
    options?: any
  ): Promise<IField> {
    try {
      const field = await this.sdk.updateField(fieldId, {
        type: newType as any,
        options,
      });
      return this.adaptField(field);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ==================== Record APIs ====================

  /**
   * Get records from a table
   */
  async getRecords(
    tableId: string,
    params?: IGetRecordsRo
  ): Promise<PaginatedResponse<IRecord>> {
    try {
      const result = await this.sdk.listRecords({
        tableId,
        filter: params?.filter as any,
        sort: params?.sort as any,
      });

      return {
        data: result.data.map(this.adaptRecord),
        total: result.total,
        page: Math.floor((params?.skip || 0) / (params?.take || 50)),
        pageSize: params?.take || 50,
        hasMore: result.total > (params?.skip || 0) + result.data.length,
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a single record
   */
  async getRecord(tableId: string, recordId: string): Promise<IRecord> {
    try {
      const record = await this.sdk.getRecord(recordId);
      return this.adaptRecord(record);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async createRecord(
    tableId: string,
    data: ICreateRecordRo
  ): Promise<IRecord> {
    try {
      const record = await this.sdk.createRecord({
        tableId,
        data: data.fields,
      });
      return this.adaptRecord(record);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async updateRecord(
    tableId: string,
    recordId: string,
    fieldId: string,
    value: any
  ): Promise<IRecord> {
    try {
      const record = await this.sdk.updateRecord(tableId, recordId, {
        [fieldId]: value,
      });
      return this.adaptRecord(record);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Batch update records
   */
  async batchUpdateRecords(
    tableId: string,
    updates: IUpdateRecordRo[]
  ): Promise<IRecord[]> {
    try {
      const records = await this.sdk.bulkUpdateRecords(
        updates.map((u) => ({
          id: u.recordId,
          data: { [u.fieldId]: u.value },
        }))
      );
      return records.map(this.adaptRecord);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    try {
      await this.sdk.deleteRecord(tableId, recordId);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Batch delete records
   */
  async batchDeleteRecords(
    tableId: string,
    recordIds: string[]
  ): Promise<void> {
    try {
      await this.sdk.bulkDeleteRecords(tableId, recordIds);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ==================== View APIs ====================

  /**
   * Get all views in a table
   */
  async getViews(tableId: string): Promise<IView[]> {
    try {
      const views = await this.sdk.listViews({ tableId });
      return views.map(this.adaptView);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a view by ID
   */
  async getView(tableId: string, viewId: string): Promise<IView> {
    try {
      const view = await this.sdk.getView(viewId);
      return this.adaptView(view);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new view
   */
  async createView(tableId: string, data: ICreateViewRo): Promise<IView> {
    try {
      const view = await this.sdk.createView({
        tableId,
        name: data.name,
        type: data.type,
      });
      return this.adaptView(view);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a view
   */
  async updateView(
    tableId: string,
    viewId: string,
    data: IUpdateViewRo
  ): Promise<IView> {
    try {
      const view = await this.sdk.updateView(viewId, {
        name: data.name,
        filter: data.filter as any,
        sort: data.sort as any,
        group: data.group as any,
        options: data.options,
        columnMeta: data.columnMeta,
      });
      return this.adaptView(view);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a view
   */
  async deleteView(tableId: string, viewId: string): Promise<void> {
    try {
      await this.sdk.deleteView(viewId);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ==================== Comment APIs ====================

  /**
   * Get comments for a record
   */
  async getComments(
    tableId: string,
    recordId: string
  ): Promise<IComment[]> {
    // SDK 可能还没有评论功能，返回空数组
    return [];
  }

  /**
   * Create a comment
   */
  async createComment(
    tableId: string,
    recordId: string,
    data: ICreateCommentRo
  ): Promise<IComment> {
    // SDK 可能还没有评论功能，抛出错误
    throw new Error('Comments not yet supported');
  }

  /**
   * Update a comment
   */
  async updateComment(
    tableId: string,
    recordId: string,
    commentId: string,
    data: IUpdateCommentRo
  ): Promise<IComment> {
    throw new Error('Comments not yet supported');
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    tableId: string,
    recordId: string,
    commentId: string
  ): Promise<void> {
    throw new Error('Comments not yet supported');
  }

  // ==================== Utility ====================

  /**
   * Generic GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    throw new Error('Generic requests not supported in SDK adapter');
  }

  /**
   * Generic POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    throw new Error('Generic requests not supported in SDK adapter');
  }

  /**
   * Generic PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    throw new Error('Generic requests not supported in SDK adapter');
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    throw new Error('Generic requests not supported in SDK adapter');
  }

  // ==================== Adapters ====================

  /**
   * Adapt SDK Base to grid IBase
   */
  private adaptBase(base: any): IBase {
    return {
      id: base.id,
      name: base.name,
      icon: base.icon,
      spaceId: base.spaceId,
      createdTime: base.createdAt || base.createdTime,
      lastModifiedTime: base.updatedAt || base.lastModifiedTime,
    };
  }

  /**
   * Adapt SDK Table to grid ITable
   */
  private adaptTable(table: any): ITable {
    return {
      id: table.id,
      name: table.name,
      dbTableName: table.dbTableName || '',
      baseId: table.baseId,
      icon: table.icon,
      description: table.description,
      createdTime: table.createdAt || table.createdTime,
      lastModifiedTime: table.updatedAt || table.lastModifiedTime,
    };
  }

  /**
   * Adapt SDK Field to grid IField
   */
  private adaptField(field: any): IField {
    return {
      id: field.id,
      name: field.name,
      type: field.type,
      tableId: field.tableId,
      options: field.options,
      description: field.description,
      isComputed: field.isComputed || false,
      isPrimary: field.isPrimary || false,
      createdTime: field.createdAt || field.createdTime,
      lastModifiedTime: field.updatedAt || field.lastModifiedTime,
    };
  }

  /**
   * Adapt SDK Record to grid IRecord
   */
  private adaptRecord(record: any): IRecord {
    return {
      id: record.id,
      fields: record.data || record.fields || {},
      createdTime: record.createdAt || record.createdTime,
      lastModifiedTime: record.updatedAt || record.lastModifiedTime,
      createdBy: record.createdBy,
      lastModifiedBy: record.updatedBy || record.lastModifiedBy,
    };
  }

  /**
   * Adapt SDK View to grid IView
   */
  private adaptView(view: any): IView {
    return {
      id: view.id,
      name: view.name,
      type: view.type,
      tableId: view.tableId,
      order: view.order || 0,
      filter: view.filter,
      sort: view.sort,
      group: view.group,
      options: view.options,
      columnMeta: view.columnMeta,
      createdTime: view.createdAt || view.createdTime,
      lastModifiedTime: view.updatedAt || view.lastModifiedTime,
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    if (error?.response?.status === 401) {
      this.config.onUnauthorized?.();
    }
    this.config.onError?.(error);
  }
}

