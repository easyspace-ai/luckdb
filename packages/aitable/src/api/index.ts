/**
 * API Module Exports
 */

// 导出旧的 ApiClient 为 LegacyApiClient（向后兼容）
export { ApiClient as LegacyApiClient } from './client';

// 导出 SDK 适配器
export { SDKAdapter } from './sdk-adapter';

// 导出类型
export * from './types';

// 导出 SDK 类型
export * from './sdk-types';

// 默认导出：推荐使用 SDK 适配器
export { SDKAdapter as ApiClient } from './sdk-adapter';

// 创建 API 客户端的工厂函数
export { createApiClient, createSDKAdapter, createLegacyClient } from './factory';


