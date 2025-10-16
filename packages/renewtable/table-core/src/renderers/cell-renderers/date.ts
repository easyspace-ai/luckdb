/**
 * Date Cell Renderer
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

export const dateRenderer: CellRenderer<string | Date> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value, style } = context;

    if (!value) return;

    ctx.save();

    // Set text style
    ctx.fillStyle = style.color || '#333';
    ctx.font = `${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`;
    ctx.textBaseline = 'middle';

    // Calculate text position
    const padding = style.padding || 8;
    const textX = rect.x + padding;
    const textY = rect.y + rect.height / 2;

    // Format date
    let displayText = '';
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      displayText = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      displayText = String(value);
    }

    ctx.fillText(displayText, textX, textY);

    ctx.restore();
  },
};

