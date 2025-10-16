/**
 * Renderer Registry
 * Manages cell renderers for different data types
 */

import { CellRenderer } from '../types/canvas';
import { textRenderer } from './cell-renderers/text';
import { numberRenderer } from './cell-renderers/number';
import { booleanRenderer } from './cell-renderers/boolean';
import { dateRenderer } from './cell-renderers/date';
import { selectRenderer } from './cell-renderers/select';
import { ratingRenderer } from './cell-renderers/rating';

export class RendererRegistry {
  private renderers = new Map<string, CellRenderer>();

  constructor() {
    // Register default renderers
    this.register('text', textRenderer);
    this.register('number', numberRenderer);
    this.register('boolean', booleanRenderer);
    this.register('date', dateRenderer);
    this.register('select', selectRenderer);
    this.register('rating', ratingRenderer);
  }

  public register(type: string, renderer: CellRenderer): void {
    this.renderers.set(type, renderer);
  }

  public get(type: string): CellRenderer {
    return this.renderers.get(type) || textRenderer;
  }

  public has(type: string): boolean {
    return this.renderers.has(type);
  }

  public unregister(type: string): void {
    this.renderers.delete(type);
  }

  public clear(): void {
    this.renderers.clear();
  }

  public getAll(): Map<string, CellRenderer> {
    return new Map(this.renderers);
  }
}

