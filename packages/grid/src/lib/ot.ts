/**
 * Operational Transformation (OT) Utilities
 * 操作转换算法实现
 */

export type OTOperation =
  | { type: 'insert'; path: string[]; value: unknown }
  | { type: 'delete'; path: string[]; oldValue: unknown }
  | { type: 'replace'; path: string[]; value: unknown; oldValue: unknown }
  | { type: 'move'; from: string[]; to: string[] };

export interface IOTResult {
  operation: OTOperation;
  transformed: boolean;
}

/**
 * OT 操作转换器
 */
export class OTTransformer {
  /**
   * 转换两个并发操作
   * @param op1 第一个操作
   * @param op2 第二个操作
   * @returns 转换后的操作
   */
  static transform(op1: OTOperation, op2: OTOperation): IOTResult {
    // Insert vs Insert
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    }

    // Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    }

    // Delete vs Insert
    if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    }

    // Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }

    // Replace vs Replace
    if (op1.type === 'replace' && op2.type === 'replace') {
      return this.transformReplaceReplace(op1, op2);
    }

    // 其他情况，不需要转换
    return { operation: op1, transformed: false };
  }

  /**
   * Insert vs Insert 转换
   */
  private static transformInsertInsert(
    op1: Extract<OTOperation, { type: 'insert' }>,
    op2: Extract<OTOperation, { type: 'insert' }>
  ): IOTResult {
    // 如果路径相同，保持op1不变（先到先得）
    if (this.pathEquals(op1.path, op2.path)) {
      return { operation: op1, transformed: false };
    }

    return { operation: op1, transformed: false };
  }

  /**
   * Insert vs Delete 转换
   */
  private static transformInsertDelete(
    op1: Extract<OTOperation, { type: 'insert' }>,
    op2: Extract<OTOperation, { type: 'delete' }>
  ): IOTResult {
    // 如果删除的路径是插入路径的祖先，取消插入
    if (this.isAncestor(op2.path, op1.path)) {
      return { operation: op1, transformed: true };
    }

    return { operation: op1, transformed: false };
  }

  /**
   * Delete vs Insert 转换
   */
  private static transformDeleteInsert(
    op1: Extract<OTOperation, { type: 'delete' }>,
    op2: Extract<OTOperation, { type: 'insert' }>
  ): IOTResult {
    // 如果插入的路径在删除路径下，调整删除路径
    if (this.isAncestor(op1.path, op2.path)) {
      return { operation: op1, transformed: true };
    }

    return { operation: op1, transformed: false };
  }

  /**
   * Delete vs Delete 转换
   */
  private static transformDeleteDelete(
    op1: Extract<OTOperation, { type: 'delete' }>,
    op2: Extract<OTOperation, { type: 'delete' }>
  ): IOTResult {
    // 如果删除同一路径，op1无效
    if (this.pathEquals(op1.path, op2.path)) {
      return { operation: op1, transformed: true };
    }

    return { operation: op1, transformed: false };
  }

  /**
   * Replace vs Replace 转换
   */
  private static transformReplaceReplace(
    op1: Extract<OTOperation, { type: 'replace' }>,
    op2: Extract<OTOperation, { type: 'replace' }>
  ): IOTResult {
    // 如果替换同一路径，使用op2的oldValue更新op1
    if (this.pathEquals(op1.path, op2.path)) {
      return {
        operation: {
          ...op1,
          oldValue: op2.value, // 使用op2的新值作为op1的旧值
        },
        transformed: true,
      };
    }

    return { operation: op1, transformed: false };
  }

  /**
   * 检查路径是否相等
   */
  private static pathEquals(path1: string[], path2: string[]): boolean {
    if (path1.length !== path2.length) return false;
    return path1.every((segment, index) => segment === path2[index]);
  }

  /**
   * 检查path1是否是path2的祖先
   */
  private static isAncestor(path1: string[], path2: string[]): boolean {
    if (path1.length >= path2.length) return false;
    return path1.every((segment, index) => segment === path2[index]);
  }
}

/**
 * 冲突解决器
 */
export class ConflictResolver {
  /**
   * 解决冲突
   * @param localOps 本地操作队列
   * @param remoteOp 远程操作
   * @returns 转换后的本地操作队列
   */
  static resolve(localOps: OTOperation[], remoteOp: OTOperation): OTOperation[] {
    const transformedOps: OTOperation[] = [];

    for (const localOp of localOps) {
      const result = OTTransformer.transform(localOp, remoteOp);
      
      if (!result.transformed || this.shouldKeepOperation(result.operation)) {
        transformedOps.push(result.operation);
      }
    }

    return transformedOps;
  }

  /**
   * 判断操作是否应该保留
   */
  private static shouldKeepOperation(op: OTOperation): boolean {
    // 可以添加更多逻辑来决定是否保留操作
    return true;
  }

  /**
   * 合并操作
   */
  static mergeOperations(ops: OTOperation[]): OTOperation[] {
    const merged: OTOperation[] = [];
    const replaceMap = new Map<string, Extract<OTOperation, { type: 'replace' }>>();

    for (const op of ops) {
      if (op.type === 'replace') {
        const key = op.path.join('.');
        const existing = replaceMap.get(key);
        
        if (existing) {
          // 合并多个替换操作
          replaceMap.set(key, {
            ...op,
            oldValue: existing.oldValue, // 保留最初的旧值
          });
        } else {
          replaceMap.set(key, op);
        }
      } else {
        merged.push(op);
      }
    }

    // 添加合并后的替换操作
    merged.push(...Array.from(replaceMap.values()));

    return merged;
  }
}

