/**
 * API Client Factory
 * 工厂函数用于创建 API 客户端
 */

import { SDKAdapter, SDKAdapterConfig } from './sdk-adapter';
import { ApiClient as LegacyApiClient, ApiClientConfig } from './client';

export type ApiClientType = 'sdk' | 'legacy';

export interface CreateApiClientOptions {
  baseURL: string;
  token?: string;
  timeout?: number;
  onError?: (error: any) => void;
  onUnauthorized?: () => void;
  type?: ApiClientType;
}

/**
 * 创建 API 客户端
 * @param options - 客户端配置选项
 * @returns API 客户端实例
 */
export function createApiClient(options: CreateApiClientOptions): SDKAdapter | LegacyApiClient {
  const { type = 'sdk', ...config } = options;

  if (type === 'sdk') {
    return new SDKAdapter(config as SDKAdapterConfig);
  } else {
    return new LegacyApiClient(config as ApiClientConfig);
  }
}

/**
 * 创建 SDK 适配器（推荐）
 */
export function createSDKAdapter(config: SDKAdapterConfig): SDKAdapter {
  return new SDKAdapter(config);
}

/**
 * 创建传统 API 客户端（向后兼容）
 */
export function createLegacyClient(config: ApiClientConfig): LegacyApiClient {
  return new LegacyApiClient(config);
}

