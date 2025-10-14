import type { IDateCell } from './interface';
import { CellType } from './interface';
import type { IBaseCellRenderer } from './interface';

export const dateCellRenderer: IBaseCellRenderer<IDateCell> = {
  type: CellType.Date,
  draw: (cell, props) => {
    const { ctx, theme, rect } = props;
    const { data } = cell;
    const { cellTextColor, cellLineColor } = theme;
    const { x, y, width, height } = rect;

    // 设置文本样式
    ctx.fillStyle = cellTextColor;
    ctx.font = `${theme.fontSizeSM}px ${theme.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 绘制日期文本
    if (data) {
      const text = typeof data === 'string' ? data : String(data);
      const textX = x + 8;
      const textY = y + height / 2;
      ctx.fillText(text, textX, textY);
    }

    // 绘制边框
    if (props.isActive) {
      ctx.strokeStyle = theme.cellLineColorActived;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    }
  },
  needsHover: true,
};
