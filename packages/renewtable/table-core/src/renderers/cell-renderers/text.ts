/**
 * Text Cell Renderer
 * Based on aitable's textCellRenderer
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

export const textRenderer: CellRenderer<string> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value, style } = context;

    if (!value && value !== 0) return;

    ctx.save();

    // Set text style
    ctx.fillStyle = style.color || '#333';
    ctx.font = `${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`;
    ctx.textBaseline = 'middle';

    // Calculate text position
    const padding = style.padding || 8;
    const textX = rect.x + padding;
    const textY = rect.y + rect.height / 2;

    // Draw text with ellipsis if needed
    const maxWidth = rect.width - padding * 2;
    let displayText = String(value);

    // Measure text and add ellipsis if needed
    const textMetrics = ctx.measureText(displayText);
    if (textMetrics.width > maxWidth) {
      // Binary search for the right length
      let end = displayText.length;
      while (end > 0) {
        const truncated = displayText.substring(0, end) + '...';
        const truncatedWidth = ctx.measureText(truncated).width;
        if (truncatedWidth <= maxWidth) {
          displayText = truncated;
          break;
        }
        end--;
      }
    }

    ctx.fillText(displayText, textX, textY);

    ctx.restore();
  },

  measure(value: string, style) {
    // Create temporary canvas for measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: 0, height: 0 };

    ctx.font = `${style.fontSize || 14}px ${style.fontFamily || 'sans-serif'}`;
    const metrics = ctx.measureText(String(value));
    const padding = style.padding || 8;

    return {
      width: metrics.width + padding * 2,
      height: style.fontSize || 14 + padding * 2,
    };
  },
};

