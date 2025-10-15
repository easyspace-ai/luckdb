/**
 * CSV 导出器
 * 支持将表格数据导出为 CSV 格式
 */

import type { IRow, IColumn } from '../../core/types';

export interface ICSVExportConfig {
  delimiter?: string; // 分隔符，默认逗号
  lineBreak?: string; // 换行符
  encoding?: string; // 编码，默认 UTF-8
  includeHeader?: boolean; // 是否包含表头
  quotes?: 'all' | 'auto' | 'none'; // 引号策略
}

export class CSVExporter {
  private config: Required<ICSVExportConfig>;

  constructor(config?: Partial<ICSVExportConfig>) {
    this.config = {
      delimiter: config?.delimiter ?? ',',
      lineBreak: config?.lineBreak ?? '\n',
      encoding: config?.encoding ?? 'utf-8',
      includeHeader: config?.includeHeader ?? true,
      quotes: config?.quotes ?? 'auto',
    };
  }

  /**
   * 导出为 CSV 字符串
   */
  export(rows: IRow[], columns: IColumn[]): string {
    const lines: string[] = [];

    // 添加表头
    if (this.config.includeHeader) {
      const headerLine = columns
        .map((col) => this.formatField(col.title || col.key || ''))
        .join(this.config.delimiter);
      lines.push(headerLine);
    }

    // 添加数据行
    rows.forEach((row) => {
      const values = columns.map((col) => {
        const value = row.data[col.key];
        return this.formatField(this.valueToString(value));
      });
      lines.push(values.join(this.config.delimiter));
    });

    return lines.join(this.config.lineBreak);
  }

  /**
   * 导出为 Blob（用于下载）
   */
  exportAsBlob(rows: IRow[], columns: IColumn[]): Blob {
    const csvContent = this.export(rows, columns);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * 触发下载
   */
  download(rows: IRow[], columns: IColumn[], filename: string = 'export.csv'): void {
    const blob = this.exportAsBlob(rows, columns);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // 清理
    URL.revokeObjectURL(url);
  }

  // ==================== 私有方法 ====================

  /**
   * 格式化字段（处理引号和转义）
   */
  private formatField(value: string): string {
    const { delimiter, quotes } = this.config;

    // 检查是否需要引号
    const needsQuotes =
      quotes === 'all' ||
      (quotes === 'auto' &&
        (value.includes(delimiter) ||
          value.includes('"') ||
          value.includes('\n') ||
          value.includes('\r')));

    if (!needsQuotes) {
      return value;
    }

    // 转义双引号
    const escaped = value.replace(/"/g, '""');

    return `"${escaped}"`;
  }

  /**
   * 值转字符串
   */
  private valueToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      // 数组或对象转 JSON
      return JSON.stringify(value);
    }

    return String(value);
  }
}
