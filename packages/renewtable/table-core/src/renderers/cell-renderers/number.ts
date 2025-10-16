/**
 * Number Cell Renderer
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

export const numberRenderer: CellRenderer<number> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value, style } = context;

    if (value === null || value === undefined) return;

    ctx.save();

    // Set text style
    ctx.fillStyle = style.color || '#333';
    ctx.font = `${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; // Numbers align right

    // Calculate text position
    const padding = style.padding || 8;
    const textX = rect.x + rect.width - padding;
    const textY = rect.y + rect.height / 2;

    // Format number
    const displayText = typeof value === 'number' 
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(value);

    ctx.fillText(displayText, textX, textY);

    ctx.restore();
  },
};

