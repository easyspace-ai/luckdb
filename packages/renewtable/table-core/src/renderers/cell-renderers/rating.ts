/**
 * Rating Cell Renderer
 * Renders star ratings
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

export const ratingRenderer: CellRenderer<number> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value } = context;

    if (value === null || value === undefined) return;

    ctx.save();

    const maxRating = 5;
    const starSize = 16;
    const spacing = 4;
    const rating = Math.min(maxRating, Math.max(0, Math.floor(value)));

    const totalWidth = maxRating * starSize + (maxRating - 1) * spacing;
    let startX = rect.x + (rect.width - totalWidth) / 2;
    const startY = rect.y + (rect.height - starSize) / 2;

    // Draw stars
    for (let i = 0; i < maxRating; i++) {
      const filled = i < rating;

      ctx.fillStyle = filled ? '#ffc107' : '#e0e0e0';

      // Draw star shape (simple approximation)
      ctx.font = `${starSize}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(filled ? '★' : '☆', startX, startY);

      startX += starSize + spacing;
    }

    ctx.restore();
  },
};

