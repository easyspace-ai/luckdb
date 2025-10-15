/**
 * IRenderer - 渲染器接口
 * 所有渲染器必须实现此接口
 */

import type { IRenderData } from '../../types';

export interface IRenderer {
  /**
   * 渲染一帧
   */
  render(data: IRenderData): void;

  /**
   * 清空画布
   */
  clear(): void;

  /**
   * 销毁渲染器
   */
  destroy(): void;
}
