/**
 * Select Cell Renderer
 * Renders select/tag values with colored badges
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

const TAG_COLORS = [
  '#e3f2fd', // blue
  '#f3e5f5', // purple
  '#e8f5e9', // green
  '#fff3e0', // orange
  '#fce4ec', // pink
];

export const selectRenderer: CellRenderer<string | string[]> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value, style } = context;

    if (!value) return;

    ctx.save();

    const padding = style.padding || 8;
    let currentX = rect.x + padding;
    const currentY = rect.y + rect.height / 2;

    // Handle array of values (multi-select)
    const values = Array.isArray(value) ? value : [value];

    values.forEach((val, index) => {
      const bgColor = TAG_COLORS[index % TAG_COLORS.length] || '#e0e0e0';
      const textColor = '#333';

      // Measure text
      ctx.font = `${(style.fontSize || 14) - 2}px ${style.fontFamily || 'sans-serif'}`;
      const textMetrics = ctx.measureText(String(val));
      const tagWidth = textMetrics.width + 16;
      const tagHeight = 22;

      // Check if tag fits in remaining space
      if (currentX + tagWidth > rect.x + rect.width - padding) {
        // Draw "..." if there are more tags
        if (index < values.length - 1) {
          ctx.fillStyle = '#999';
          ctx.fillText('...', currentX, currentY);
        }
        return;
      }

      // Draw tag background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      // Manually draw rounded rect (roundRect might not be available)
      const x = currentX;
      const y = currentY - tagHeight / 2;
      const radius = 4;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + tagWidth - radius, y);
      ctx.arcTo(x + tagWidth, y, x + tagWidth, y + radius, radius);
      ctx.lineTo(x + tagWidth, y + tagHeight - radius);
      ctx.arcTo(x + tagWidth, y + tagHeight, x + tagWidth - radius, y + tagHeight, radius);
      ctx.lineTo(x + radius, y + tagHeight);
      ctx.arcTo(x, y + tagHeight, x, y + tagHeight - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fill();

      // Draw tag text
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), currentX + 8, currentY);

      currentX += tagWidth + 8;
    });

    ctx.restore();
  },
};

