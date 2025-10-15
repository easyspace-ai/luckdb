/**
 * Grid SDK 适配器
 * 将 manage 应用的 SDK 实例适配给 Grid 使用
 * 提供与 Grid 的 ApiClient 相同的接口
 */

import luckdb from './luckdb';
import { useAuthStore } from '@/stores/auth-store';
import type {
  IBase,
  ITable,
  IField,
  IRecord,
  IView,
  ICreateBaseRo,
  ICreateTableRo,
  ICreateFieldRo,
  ICreateRecordRo,
  ICreateViewRo,
  IUpdateBaseRo,
  IUpdateTableRo,
  IUpdateFieldRo,
  IUpdateRecordRo,
  IUpdateViewRo,
  IGetRecordsRo,
  PaginatedResponse,
  ITablePermission,
} from '@luckdb/grid';
import type {
  Base as SDKBase,
  Table as SDKTable,
  Field as SDKField,
  Record as SDKRecord,
  View as SDKView,
} from '@luckdb/sdk';

/**
 * 类型转换函数
 */
const convertSDKBaseToIBase = (sdkBase: SDKBase): IBase => ({
  id: sdkBase.id,
  name: sdkBase.name,
  icon: sdkBase.icon,
  spaceId: sdkBase.spaceId,
  createdTime: sdkBase.createdAt || new Date().toISOString(),
  lastModifiedTime: sdkBase.updatedAt || new Date().toISOString(),
});

const convertSDKTableToITable = (sdkTable: SDKTable): ITable => ({
  id: sdkTable.id,
  name: sdkTable.name,
  dbTableName: sdkTable.dbTableName || sdkTable.name,
  baseId: sdkTable.baseId,
  icon: sdkTable.icon,
  description: sdkTable.description,
  createdTime: sdkTable.createdAt || new Date().toISOString(),
  lastModifiedTime: sdkTable.updatedAt || new Date().toISOString(),
});

const convertSDKFieldToIField = (sdkField: SDKField): IField => ({
  id: sdkField.id,
  name: sdkField.name,
  type: sdkField.type as any,
  tableId: sdkField.tableId,
  options: sdkField.options,
  description: sdkField.description,
  isComputed: false, // 默认值
  isPrimary: false, // 默认值
  createdTime: sdkField.createdAt || new Date().toISOString(),
  lastModifiedTime: sdkField.updatedAt || new Date().toISOString(),
});

const convertSDKRecordToIRecord = (sdkRecord: SDKRecord): IRecord => ({
  id: sdkRecord.id,
  fields: sdkRecord.data || {},
  createdTime: sdkRecord.createdAt,
  lastModifiedTime: sdkRecord.updatedAt || undefined,
  createdBy: sdkRecord.createdBy,
  lastModifiedBy: sdkRecord.updatedBy || undefined,
});

const convertSDKViewToIView = (sdkView: SDKView): IView => ({
  id: sdkView.id,
  name: sdkView.name,
  type: sdkView.type as any,
  tableId: sdkView.tableId,
  order: sdkView.order || 0,
  filter: sdkView.filter,
  sort: sdkView.sort,
  group: sdkView.group,
  options: sdkView.options,
  columnMeta: sdkView.columnMeta,
  createdTime: sdkView.createdAt || new Date().toISOString(),
  lastModifiedTime: sdkView.updatedAt || new Date().toISOString(),
});

/**
 * Grid SDK 适配器类
 * 实现与 Grid ApiClient 相同的接口，底层使用 LuckDB SDK
 */
export class GridSdkAdapter {
  private luckdb = luckdb;

  constructor() {
    // 确保 SDK 使用正确的认证信息
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      this.luckdb.setAccessToken(accessToken);
    }
  }

  // ==================== Base APIs ====================

  async getBases(): Promise<IBase[]> {
    const bases = await this.luckdb.listBases();
    return bases.map(convertSDKBaseToIBase);
  }

  async getBase(id: string): Promise<IBase> {
    const base = await this.luckdb.getBase(id);
    return convertSDKBaseToIBase(base);
  }

  async createBase(data: ICreateBaseRo): Promise<IBase> {
    const base = await this.luckdb.createBase(data);
    return convertSDKBaseToIBase(base);
  }

  async updateBase(id: string, data: IUpdateBaseRo): Promise<IBase> {
    const base = await this.luckdb.updateBase(id, data);
    return convertSDKBaseToIBase(base);
  }

  async deleteBase(id: string): Promise<void> {
    await this.luckdb.deleteBase(id);
  }

  // ==================== Table APIs ====================

  async getTables(baseId: string): Promise<ITable[]> {
    const tables = await this.luckdb.listTables({ baseId });
    return tables.map(convertSDKTableToITable);
  }

  async getTable(tableId: string): Promise<ITable> {
    const table = await this.luckdb.getTable(tableId);
    return convertSDKTableToITable(table);
  }

  async createTable(baseId: string, data: ICreateTableRo): Promise<ITable> {
    const table = await this.luckdb.createTable({ ...data, baseId });
    return convertSDKTableToITable(table);
  }

  async updateTable(tableId: string, data: IUpdateTableRo): Promise<ITable> {
    const table = await this.luckdb.updateTable(tableId, data);
    return convertSDKTableToITable(table);
  }

  async deleteTable(tableId: string): Promise<void> {
    await this.luckdb.deleteTable(tableId);
  }

  async getTablePermission(_tableId: string): Promise<ITablePermission> {
    // 这个方法可能需要根据实际后端 API 调整
    // 暂时返回一个默认的权限对象
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
  }

  // ==================== Field APIs ====================

  async getFields(tableId: string): Promise<IField[]> {
    const fields = await this.luckdb.listFields({ tableId });
    return fields.map(convertSDKFieldToIField);
  }

  async getField(_tableId: string, fieldId: string): Promise<IField> {
    const field = await this.luckdb.getField(fieldId);
    return convertSDKFieldToIField(field);
  }

  async createField(tableId: string, data: ICreateFieldRo): Promise<IField> {
    const field = await this.luckdb.createField({ ...data, tableId });
    return convertSDKFieldToIField(field);
  }

  async updateField(_tableId: string, fieldId: string, data: IUpdateFieldRo): Promise<IField> {
    const field = await this.luckdb.updateField(fieldId, data);
    return convertSDKFieldToIField(field);
  }

  async deleteField(_tableId: string, fieldId: string): Promise<void> {
    await this.luckdb.deleteField(fieldId);
  }

  async convertField(
    _tableId: string,
    fieldId: string,
    newType: string,
    options?: any
  ): Promise<IField> {
    // 这个方法可能需要根据实际后端 API 调整
    const field = await this.luckdb.updateField(fieldId, { type: newType as any, options });
    return convertSDKFieldToIField(field);
  }

  // ==================== Record APIs ====================

  async getRecords(tableId: string, params?: IGetRecordsRo): Promise<PaginatedResponse<IRecord>> {
    // 转换参数格式
    const sdkParams = {
      tableId,
      limit: params?.take || 100,
      offset: params?.skip || 0,
      // 其他参数可能需要进一步转换
    };
    const result = await this.luckdb.listRecords(sdkParams);

    return {
      data: result.data.map(convertSDKRecordToIRecord),
      total: result.total,
      page: Math.floor((params?.skip || 0) / (params?.take || 100)) + 1,
      pageSize: params?.take || 100,
      hasMore: (params?.skip || 0) + (params?.take || 100) < result.total,
    };
  }

  async getRecord(_tableId: string, recordId: string): Promise<IRecord> {
    const record = await this.luckdb.getRecord(recordId);
    return convertSDKRecordToIRecord(record);
  }

  async createRecord(tableId: string, data: ICreateRecordRo): Promise<IRecord> {
    const record = await this.luckdb.createRecord({ data: data.fields, tableId });
    return convertSDKRecordToIRecord(record);
  }

  async updateRecord(
    tableId: string,
    recordId: string,
    fieldId: string,
    value: any
  ): Promise<IRecord> {
    // 这个方法需要适配 SDK 的接口
    const updateData = { [fieldId]: value };
    const record = await this.luckdb.updateRecord(tableId, recordId, updateData);
    return convertSDKRecordToIRecord(record);
  }

  async batchUpdateRecords(_tableId: string, updates: IUpdateRecordRo[]): Promise<IRecord[]> {
    // 这个方法需要根据实际后端 API 调整
    const sdkUpdates = updates.map((update) => ({
      id: update.recordId,
      data: { [update.fieldId]: update.value },
    }));
    const records = await this.luckdb.bulkUpdateRecords(sdkUpdates);
    return records.map(convertSDKRecordToIRecord);
  }

  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    await this.luckdb.deleteRecord(tableId, recordId);
  }

  async batchDeleteRecords(tableId: string, recordIds: string[]): Promise<void> {
    await this.luckdb.bulkDeleteRecords(tableId, recordIds);
  }

  // ==================== View APIs ====================

  async getViews(tableId: string): Promise<IView[]> {
    const views = await this.luckdb.listViews({ tableId });
    return views.map(convertSDKViewToIView);
  }

  async getView(_tableId: string, viewId: string): Promise<IView> {
    const view = await this.luckdb.getView(viewId);
    return convertSDKViewToIView(view);
  }

  async createView(tableId: string, data: ICreateViewRo): Promise<IView> {
    const view = await this.luckdb.createView({ ...data, tableId });
    return convertSDKViewToIView(view);
  }

  async updateView(_tableId: string, viewId: string, data: IUpdateViewRo): Promise<IView> {
    const view = await this.luckdb.updateView(viewId, data);
    return convertSDKViewToIView(view);
  }

  async deleteView(_tableId: string, viewId: string): Promise<void> {
    await this.luckdb.deleteView(viewId);
  }

  // ==================== Utility Methods ====================

  /**
   * 更新认证令牌
   */
  setToken(token: string): void {
    this.luckdb.setAccessToken(token);
  }

  /**
   * 清除认证令牌
   */
  clearToken(): void {
    this.luckdb.clearTokens();
  }

  /**
   * 获取通用 GET 请求
   */
  async get<T = any>(_url: string, _config?: any): Promise<T> {
    // 这个方法可能需要根据实际需求调整
    throw new Error('Generic GET method not implemented in GridSdkAdapter');
  }

  /**
   * 获取通用 POST 请求
   */
  async post<T = any>(_url: string, _data?: any, _config?: any): Promise<T> {
    // 这个方法可能需要根据实际需求调整
    throw new Error('Generic POST method not implemented in GridSdkAdapter');
  }

  /**
   * 获取通用 PATCH 请求
   */
  async patch<T = any>(_url: string, _data?: any, _config?: any): Promise<T> {
    // 这个方法可能需要根据实际需求调整
    throw new Error('Generic PATCH method not implemented in GridSdkAdapter');
  }

  /**
   * 获取通用 DELETE 请求
   */
  async delete<T = any>(_url: string, _config?: any): Promise<T> {
    // 这个方法可能需要根据实际需求调整
    throw new Error('Generic DELETE method not implemented in GridSdkAdapter');
  }
}

/**
 * 创建 Grid SDK 适配器实例
 */
export const createGridSdkAdapter = () => {
  return new GridSdkAdapter();
};

/**
 * 获取当前用户信息，供 Grid 使用
 */
export const getCurrentUserInfo = () => {
  const { user } = useAuthStore.getState();
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    : null;
};

/**
 * 获取 WebSocket URL
 */
export const getWebSocketUrl = () => {
  // 使用环境变量或默认值
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  // 将 http:// 替换为 ws://，https:// 替换为 wss://
  return baseUrl.replace(/^http/, 'ws');
};
