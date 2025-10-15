/**
 * SDK 集成示例
 * 展示如何在 Grid 包中使用 @luckdb/sdk
 */

import React from 'react';
import {
  AppProviders,
  Grid,
  createSDKAdapter,
  createLegacyClient,
  createApiClient,
  useBase,
  useTable,
} from '@luckdb/aitable';
import type {
  SDKBase,
  SDKTable,
  SDKField,
  SDKRecord,
  CreateBaseRequest,
  CreateTableRequest,
  CreateFieldRequest,
  CreateRecordRequest,
} from '@luckdb/aitable';

// ==================== 方式 1: 使用 SDK 适配器（推荐） ====================

function ExampleWithSDKAdapter() {
  // 创建 SDK 适配器
  const apiClient = createSDKAdapter({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
    token: localStorage.getItem('authToken') || undefined,
    onError: (error) => {
      console.error('API Error:', error);
    },
    onUnauthorized: () => {
      console.log('Unauthorized - redirecting to login');
      window.location.href = '/login';
    },
  });

  return (
    <AppProviders
      baseId="base-123"
      tableId="table-456"
      viewId="view-789"
      apiClient={apiClient}
    >
      <Grid />
    </AppProviders>
  );
}

// ==================== 方式 2: 使用传统客户端（向后兼容） ====================

function ExampleWithLegacyClient() {
  const apiClient = createLegacyClient({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
    token: localStorage.getItem('authToken') || undefined,
  });

  return (
    <AppProviders
      baseId="base-123"
      tableId="table-456"
      viewId="view-789"
      apiClient={apiClient}
    >
      <Grid />
    </AppProviders>
  );
}

// ==================== 方式 3: 使用工厂函数（动态选择） ====================

function ExampleWithFactory() {
  // 从环境变量或配置中读取使用哪种客户端
  const clientType = (process.env.REACT_APP_API_CLIENT_TYPE as 'sdk' | 'legacy') || 'sdk';

  const apiClient = createApiClient({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
    token: localStorage.getItem('authToken') || undefined,
    type: clientType,
    onError: (error) => {
      console.error('API Error:', error);
    },
    onUnauthorized: () => {
      window.location.href = '/login';
    },
  });

  return (
    <AppProviders
      baseId="base-123"
      tableId="table-456"
      viewId="view-789"
      apiClient={apiClient}
    >
      <Grid />
    </AppProviders>
  );
}

// ==================== 方式 4: 使用 Hook 管理 API 客户端 ====================

function useApiClient() {
  const [token, setToken] = React.useState(() => 
    localStorage.getItem('authToken') || undefined
  );

  const apiClient = React.useMemo(() => {
    return createSDKAdapter({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
      token,
      onError: (error) => {
        console.error('API Error:', error);
      },
      onUnauthorized: () => {
        setToken(undefined);
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      },
    });
  }, [token]);

  // 更新 token 的方法
  const updateToken = React.useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    apiClient.setToken(newToken);
  }, [apiClient]);

  // 清除 token 的方法
  const clearToken = React.useCallback(() => {
    setToken(undefined);
    localStorage.removeItem('authToken');
    apiClient.clearToken();
  }, [apiClient]);

  return { apiClient, updateToken, clearToken };
}

function ExampleWithHook() {
  const { apiClient } = useApiClient();

  return (
    <AppProviders
      baseId="base-123"
      tableId="table-456"
      viewId="view-789"
      apiClient={apiClient}
    >
      <Grid />
    </AppProviders>
  );
}

// ==================== 方式 5: 在上下文中使用 API ====================

function ExampleUsingContext() {
  const apiClient = createSDKAdapter({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
    token: localStorage.getItem('authToken') || undefined,
  });

  return (
    <AppProviders
      baseId="base-123"
      tableId="table-456"
      apiClient={apiClient}
    >
      <MyComponent />
    </AppProviders>
  );
}

function MyComponent() {
  const { bases, currentBase, createBase } = useBase();
  const { tables, currentTable, createTable } = useTable();

  const handleCreateBase = async () => {
    const newBase = await createBase({
      name: 'New Base',
      spaceId: 'space-123',
    });
    console.log('Created base:', newBase);
  };

  const handleCreateTable = async () => {
    if (!currentBase) return;
    
    const newTable = await createTable({
      name: 'New Table',
      baseId: currentBase.id,
    });
    console.log('Created table:', newTable);
  };

  // Note: createRecord would need to be added to the context or used from apiClient

  return (
    <div>
      <h1>Current Base: {currentBase?.name}</h1>
      <h2>Current Table: {currentTable?.name}</h2>
      
      <button onClick={handleCreateBase}>Create Base</button>
      <button onClick={handleCreateTable}>Create Table</button>

      <Grid />
    </div>
  );
}

// ==================== 类型安全示例 ====================

function TypeSafeExample() {
  const apiClient = createSDKAdapter({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  });

  const handleCreateBase = async () => {
    // 类型安全的请求
    const request: CreateBaseRequest = {
      name: 'New Base',
      spaceId: 'space-123',
      icon: '📊',
    };

    const base: SDKBase = await apiClient.createBase(request);
    console.log('Created base:', base);
  };

  const handleCreateTable = async (baseId: string) => {
    const request: CreateTableRequest = {
      name: 'New Table',
      baseId,
      description: 'A new table',
    };

    const table: SDKTable = await apiClient.createTable(baseId, request);
    console.log('Created table:', table);
  };

  const handleCreateField = async (tableId: string) => {
    const request: CreateFieldRequest = {
      name: 'Name',
      type: 'singleLineText',
      description: 'User name',
      primary: true,
    };

    const field: SDKField = await apiClient.createField(tableId, request);
    console.log('Created field:', field);
  };

  const handleCreateRecord = async (tableId: string) => {
    const request: CreateRecordRequest = {
      tableId,
      data: {
        'field-1': 'John Doe',
        'field-2': 30,
      },
    };

    const record: SDKRecord = await apiClient.createRecord(tableId, request);
    console.log('Created record:', record);
  };

  return (
    <div>
      <button onClick={handleCreateBase}>Create Base</button>
      {/* ... */}
    </div>
  );
}

// 导出所有示例
export {
  ExampleWithSDKAdapter,
  ExampleWithLegacyClient,
  ExampleWithFactory,
  ExampleWithHook,
  ExampleUsingContext,
  TypeSafeExample,
};

// 默认导出
export default ExampleWithSDKAdapter;

