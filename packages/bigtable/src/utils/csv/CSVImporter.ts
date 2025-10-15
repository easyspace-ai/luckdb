/**
 * CSV 导入器
 * 支持将 CSV 文件解析为表格数据
 */

import type { IRow, IColumn, FieldType } from '../../core/types';

export interface ICSVImportConfig {
  delimiter?: string; // 分隔符，默认自动检测
  encoding?: string; // 编码，默认自动检测
  hasHeader?: boolean; // 是否有表头
  skipEmptyRows?: boolean; // 跳过空行
  trimFields?: boolean; // 去除字段前后空格
  startRow?: number; // 从第几行开始导入（0-based）
}

export interface ICSVImportResult {
  rows: IRow[];
  columns: IColumn[];
  errors: string[];
  rowCount: number;
  columnCount: number;
}

export class CSVImporter {
  private config: Required<ICSVImportConfig>;

  constructor(config?: Partial<ICSVImportConfig>) {
    this.config = {
      delimiter: config?.delimiter ?? '', // 空表示自动检测
      encoding: config?.encoding ?? 'utf-8',
      hasHeader: config?.hasHeader ?? true,
      skipEmptyRows: config?.skipEmptyRows ?? true,
      trimFields: config?.trimFields ?? true,
      startRow: config?.startRow ?? 0,
    };
  }

  /**
   * 从字符串导入
   */
  async import(csvContent: string): Promise<ICSVImportResult> {
    const errors: string[] = [];

    try {
      // 自动检测分隔符
      const delimiter = this.config.delimiter || this.detectDelimiter(csvContent);

      // 解析 CSV
      const lines = this.parseCSV(csvContent, delimiter);

      if (lines.length === 0) {
        return {
          rows: [],
          columns: [],
          errors: ['CSV 文件为空'],
          rowCount: 0,
          columnCount: 0,
        };
      }

      // 提取表头和数据
      const startRow = this.config.startRow;
      let headerRow: string[];
      let dataRows: string[][];

      if (this.config.hasHeader) {
        headerRow = lines[startRow];
        dataRows = lines.slice(startRow + 1);
      } else {
        // 自动生成列名
        const columnCount = lines[0].length;
        headerRow = Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
        dataRows = lines.slice(startRow);
      }

      // 创建列定义
      const columns: IColumn[] = headerRow.map((title, index) => {
        const key = this.sanitizeKey(title);
        return {
          id: key,
          key,
          title: title.trim(),
          type: this.detectColumnType(dataRows, index),
          width: 150,
        };
      });

      // 创建行数据
      const rows: IRow[] = dataRows
        .filter((row) => {
          if (this.config.skipEmptyRows) {
            return row.some((cell) => cell.trim() !== '');
          }
          return true;
        })
        .map((row, index) => {
          const data: Record<string, unknown> = {};

          row.forEach((cell, colIndex) => {
            const column = columns[colIndex];
            if (column) {
              data[column.key] = this.parseValue(cell, column.type);
            }
          });

          return {
            id: index + 1,
            data,
          };
        });

      return {
        rows,
        columns,
        errors,
        rowCount: rows.length,
        columnCount: columns.length,
      };
    } catch (error) {
      return {
        rows: [],
        columns: [],
        errors: [`导入失败: ${error instanceof Error ? error.message : String(error)}`],
        rowCount: 0,
        columnCount: 0,
      };
    }
  }

  /**
   * 从文件导入
   */
  async importFromFile(file: File): Promise<ICSVImportResult> {
    const text = await this.readFileAsText(file);
    return this.import(text);
  }

  // ==================== 私有方法 ====================

  /**
   * 解析 CSV（支持引号内的换行和分隔符）
   */
  private parseCSV(content: string, delimiter: string): string[][] {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 转义的双引号
          currentField += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // 字段分隔符
        currentLine.push(this.config.trimFields ? currentField.trim() : currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // 行结束
        if (currentField || currentLine.length > 0) {
          currentLine.push(this.config.trimFields ? currentField.trim() : currentField);
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }
          currentLine = [];
          currentField = '';
        }
        // 跳过 \r\n 中的 \n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    // 处理最后一个字段
    if (currentField || currentLine.length > 0) {
      currentLine.push(this.config.trimFields ? currentField.trim() : currentField);
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * 自动检测分隔符
   */
  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0] || '';
    const delimiters = [',', '\t', ';', '|'];

    let maxCount = 0;
    let detectedDelimiter = ',';

    delimiters.forEach((delimiter) => {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    });

    return detectedDelimiter;
  }

  /**
   * 检测列类型
   */
  private detectColumnType(dataRows: string[][], columnIndex: number): FieldType {
    // 取前100行样本
    const sample = dataRows.slice(0, 100).map((row) => row[columnIndex] || '');

    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;

    sample.forEach((value) => {
      const trimmed = value.trim();

      if (!trimmed) return;

      // 检测数字
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        numberCount++;
      }

      // 检测日期
      if (this.isDate(trimmed)) {
        dateCount++;
      }

      // 检测布尔值
      if (/^(true|false|yes|no|1|0)$/i.test(trimmed)) {
        booleanCount++;
      }
    });

    const total = sample.filter((v) => v.trim()).length;
    if (total === 0) return 'text';

    const numberRatio = numberCount / total;
    const dateRatio = dateCount / total;
    const booleanRatio = booleanCount / total;

    // 超过80%认为是该类型
    if (numberRatio > 0.8) return 'number';
    if (dateRatio > 0.8) return 'date';
    if (booleanRatio > 0.8) return 'checkbox';

    return 'text';
  }

  /**
   * 解析值
   */
  private parseValue(value: string, type: FieldType): unknown {
    const trimmed = value.trim();

    if (!trimmed) return null;

    switch (type) {
      case 'number': {
        const num = Number(trimmed);
        return isNaN(num) ? trimmed : num;
      }

      case 'checkbox':
        return /^(true|yes|1)$/i.test(trimmed);

      case 'date': {
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? trimmed : date.toISOString();
      }

      default:
        return trimmed;
    }
  }

  /**
   * 判断是否为日期
   */
  private isDate(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.length > 6; // 排除纯数字
  }

  /**
   * 清理键名（移除特殊字符）
   */
  private sanitizeKey(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * 读取文件为文本
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };

      reader.onerror = () => reject(reader.error);

      reader.readAsText(file, this.config.encoding);
    });
  }
}
