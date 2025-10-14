/**
 * Presence Hook
 * 在线状态Hook
 */

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@/context/connection/ConnectionContext';
import { PresenceManager, type IUserPresence } from '@/lib/presence';
import { useSession } from '@/context/session/SessionContext';

export interface IUsePresenceOptions {
  tableId: string;
  viewId?: string;
  enabled?: boolean;
}

export interface IUsePresenceReturn {
  activeUsers: IUserPresence[];
  updateCursor: (recordId: string, fieldId: string) => Promise<void>;
  updateActiveCell: (recordId: string, fieldId: string) => Promise<void>;
  updateSelection: (recordIds: string[]) => Promise<void>;
  clearCursor: () => Promise<void>;
  clearActiveCell: () => Promise<void>;
  getUsersAtCell: (recordId: string, fieldId: string) => IUserPresence[];
  isReady: boolean;
}

/**
 * 管理用户在线状态和协作位置
 */
export function usePresence({
  tableId,
  viewId,
  enabled = true,
}: IUsePresenceOptions): IUsePresenceReturn {
  const { shareConnection, isConnected } = useConnection();
  const { user } = useSession();
  const [presenceManager, setPresenceManager] = useState<PresenceManager | null>(null);
  const [activeUsers, setActiveUsers] = useState<IUserPresence[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 初始化 Presence Manager
  useEffect(() => {
    if (!enabled || !isConnected || !shareConnection || !user) {
      setIsReady(false);
      return;
    }

    const manager = new PresenceManager({
      tableId,
      viewId,
      connection: shareConnection,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
    });

    const initializePresence = async () => {
      try {
        await manager.initialize();
        setPresenceManager(manager);
        setIsReady(true);
        console.log('[usePresence] Initialized for', tableId, viewId);
      } catch (error) {
        console.error('[usePresence] Failed to initialize:', error);
        setIsReady(false);
      }
    };

    initializePresence();

    return () => {
      if (manager) {
        manager.destroy();
        setPresenceManager(null);
        setIsReady(false);
        console.log('[usePresence] Destroyed');
      }
    };
  }, [tableId, viewId, enabled, isConnected, shareConnection, user]);

  // 监听在线用户变化
  useEffect(() => {
    if (!presenceManager) {
      return;
    }

    const unsubscribe = presenceManager.onPresenceChange((users) => {
      setActiveUsers(users);
    });

    return unsubscribe;
  }, [presenceManager]);

  const updateCursor = useCallback(
    async (recordId: string, fieldId: string) => {
      if (!presenceManager) return;
      await presenceManager.updateCursor(recordId, fieldId);
    },
    [presenceManager]
  );

  const updateActiveCell = useCallback(
    async (recordId: string, fieldId: string) => {
      if (!presenceManager) return;
      await presenceManager.updateActiveCell(recordId, fieldId);
    },
    [presenceManager]
  );

  const updateSelection = useCallback(
    async (recordIds: string[]) => {
      if (!presenceManager) return;
      await presenceManager.updateSelection(recordIds);
    },
    [presenceManager]
  );

  const clearCursor = useCallback(async () => {
    if (!presenceManager) return;
    await presenceManager.clearCursor();
  }, [presenceManager]);

  const clearActiveCell = useCallback(async () => {
    if (!presenceManager) return;
    await presenceManager.clearActiveCell();
  }, [presenceManager]);

  const getUsersAtCell = useCallback(
    (recordId: string, fieldId: string) => {
      if (!presenceManager) return [];
      return presenceManager.getUsersAtCell(recordId, fieldId);
    },
    [presenceManager]
  );

  return {
    activeUsers,
    updateCursor,
    updateActiveCell,
    updateSelection,
    clearCursor,
    clearActiveCell,
    getUsersAtCell,
    isReady,
  };
}

