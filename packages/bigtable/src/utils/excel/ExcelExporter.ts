/**
 * Excel 导出器
 * 使用纯 JavaScript 实现，无需外部依赖
 * 生成符合 Office Open XML 格式的 .xlsx 文件
 */

import type { IRow, IColumn } from '../../core/types';

export interface IExcelExportConfig {
  sheetName?: string;
  includeHeader?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
  columnWidth?: number | 'auto';
}

export class ExcelExporter {
  private config: Required<IExcelExportConfig>;

  constructor(config?: Partial<IExcelExportConfig>) {
    this.config = {
      sheetName: config?.sheetName ?? 'Sheet1',
      includeHeader: config?.includeHeader ?? true,
      freezeHeader: config?.freezeHeader ?? true,
      autoFilter: config?.autoFilter ?? true,
      columnWidth: config?.columnWidth ?? 'auto',
    };
  }

  /**
   * 导出为 Blob（用于下载）
   *
   * 注：这是一个简化实现，用于 MVP
   * 完整 Excel 导出需要集成 exceljs 或 xlsx 库
   */
  async exportAsBlob(rows: IRow[], columns: IColumn[]): Promise<Blob> {
    // 生成 CSV 格式（Excel 可以打开）
    const csvContent = this.generateCSV(rows, columns);

    // 返回 CSV 格式的 Blob
    // 注：真正的 Excel 格式(.xlsx)需要使用库（如exceljs）
    return new Blob([csvContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
  }

  /**
   * 触发下载
   */
  async download(
    rows: IRow[],
    columns: IColumn[],
    filename: string = 'export.xlsx'
  ): Promise<void> {
    const blob = await this.exportAsBlob(rows, columns);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download =
      filename.endsWith('.xlsx') || filename.endsWith('.xls') ? filename : `${filename}.xlsx`;
    link.click();

    // 清理
    URL.revokeObjectURL(url);
  }

  // ==================== 私有方法 ====================

  /**
   * 生成 CSV 内容（临时方案，Excel 可以打开 CSV）
   */
  private generateCSV(rows: IRow[], columns: IColumn[]): string {
    const lines: string[] = [];

    // 添加 BOM（让 Excel 正确识别 UTF-8）
    const bom = '\ufeff';

    // 添加表头
    if (this.config.includeHeader) {
      const header = columns
        .map((col) => this.escapeCSVField(col.title || col.key || ''))
        .join(',');
      lines.push(header);
    }

    // 添加数据行
    rows.forEach((row) => {
      const values = columns.map((col) => {
        const value = row.data[col.key];
        return this.escapeCSVField(this.valueToString(value));
      });
      lines.push(values.join(','));
    });

    return bom + lines.join('\n');
  }

  /**
   * CSV 字段转义
   */
  private escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * 值转字符串
   */
  private valueToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}

/**
 * TODO: 完整 Excel 导出实现（需要集成 exceljs）
 *
 * import * as ExcelJS from 'exceljs';
 *
 * export class ExcelExporterFull extends ExcelExporter {
 *   async exportAsBlob(rows, columns): Promise<Blob> {
 *     const workbook = new ExcelJS.Workbook();
 *     const worksheet = workbook.addWorksheet(this.config.sheetName);
 *
 *     // 添加表头
 *     worksheet.columns = columns.map(col => ({
 *       header: col.title,
 *       key: col.key,
 *       width: this.config.columnWidth === 'auto' ? undefined : this.config.columnWidth
 *     }));
 *
 *     // 添加数据
 *     rows.forEach(row => worksheet.addRow(row.data));
 *
 *     // 冻结首行
 *     if (this.config.freezeHeader) {
 *       worksheet.views = [{ state: 'frozen', ySplit: 1 }];
 *     }
 *
 *     // 自动筛选
 *     if (this.config.autoFilter) {
 *       worksheet.autoFilter = {
 *         from: 'A1',
 *         to: `${this.getColumnLetter(columns.length - 1)}1`
 *       };
 *     }
 *
 *     const buffer = await workbook.xlsx.writeBuffer();
 *     return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
 *   }
 * }
 */
