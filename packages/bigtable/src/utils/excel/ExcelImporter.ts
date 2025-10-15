/**
 * Excel 导入器
 * 使用纯 JavaScript 实现基础导入功能
 */

import type { IRow, IColumn, FieldType } from '../../core/types';

export interface IExcelImportConfig {
  sheetIndex?: number; // 导入哪个工作表（默认第一个）
  hasHeader?: boolean; // 是否有表头
  startRow?: number; // 从第几行开始
  startColumn?: number; // 从第几列开始
}

export interface IExcelImportResult {
  rows: IRow[];
  columns: IColumn[];
  errors: string[];
  rowCount: number;
  columnCount: number;
  sheetNames?: string[];
}

export class ExcelImporter {
  private config: Required<IExcelImportConfig>;

  constructor(config?: Partial<IExcelImportConfig>) {
    this.config = {
      sheetIndex: config?.sheetIndex ?? 0,
      hasHeader: config?.hasHeader ?? true,
      startRow: config?.startRow ?? 0,
      startColumn: config?.startColumn ?? 0,
    };
  }

  /**
   * 从文件导入
   *
   * 注：这是简化实现，将 Excel 文件作为 CSV 处理
   * 完整实现需要集成 xlsx 或 exceljs 库
   */
  async importFromFile(file: File): Promise<IExcelImportResult> {
    const errors: string[] = [];

    try {
      // 读取文件
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // 解析 Excel（简化版：通过 CSV 导入）
      // TODO: 集成 xlsx 库实现完整解析
      errors.push('Excel 导入功能暂时通过 CSV 格式处理，请先将 Excel 文件另存为 CSV 格式');
      errors.push('完整 Excel 导入功能将在后续版本中提供（需要集成 exceljs 库）');

      return {
        rows: [],
        columns: [],
        errors,
        rowCount: 0,
        columnCount: 0,
        sheetNames: [],
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

  // ==================== 私有方法 ====================

  /**
   * 读取文件为 ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };

      reader.onerror = () => reject(reader.error);

      reader.readAsArrayBuffer(file);
    });
  }
}

/**
 * TODO: 完整 Excel 导入实现（需要集成 xlsx）
 *
 * import * as XLSX from 'xlsx';
 *
 * export class ExcelImporterFull extends ExcelImporter {
 *   async importFromFile(file: File): Promise<IExcelImportResult> {
 *     const arrayBuffer = await this.readFileAsArrayBuffer(file);
 *     const workbook = XLSX.read(arrayBuffer, { type: 'array' });
 *
 *     const sheetNames = workbook.SheetNames;
 *     const sheetName = sheetNames[this.config.sheetIndex];
 *     const worksheet = workbook.Sheets[sheetName];
 *
 *     // 转为 JSON
 *     const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
 *
 *     // 解析为 IRow[] 和 IColumn[]
 *     const { rows, columns } = this.parseData(jsonData);
 *
 *     return {
 *       rows,
 *       columns,
 *       errors: [],
 *       rowCount: rows.length,
 *       columnCount: columns.length,
 *       sheetNames,
 *     };
 *   }
 * }
 */
