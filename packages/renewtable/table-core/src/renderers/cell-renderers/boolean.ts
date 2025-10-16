/**
 * Boolean Cell Renderer (Checkbox)
 */

import { CellRenderer, CellRenderContext } from '../../types/canvas';

export const booleanRenderer: CellRenderer<boolean> = {
  draw(context: CellRenderContext): void {
    const { ctx, rect, value } = context;

    ctx.save();

    // Calculate checkbox position (centered)
    const checkboxSize = 16;
    const x = rect.x + (rect.width - checkboxSize) / 2;
    const y = rect.y + (rect.height - checkboxSize) / 2;

    // Draw checkbox border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, checkboxSize, checkboxSize);

    // Draw checkmark if true
    if (value) {
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(x + 2, y + 2, checkboxSize - 4, checkboxSize - 4);

      // Draw check symbol
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 8);
      ctx.lineTo(x + 7, y + 11);
      ctx.lineTo(x + 12, y + 5);
      ctx.stroke();
    }

    ctx.restore();
  },
};

