/**
 * 导入导出 Hook
 */

import { useCallback } from 'react';
import type { IRow, IColumn } from '../../core/types';
import { CSVExporter, CSVImporter } from '../../utils/csv';
import { ExcelExporter } from '../../utils/excel';

export interface IUseImportExportConfig {
  rows: IRow[];
  columns: IColumn[];
  onImport?: (rows: IRow[], columns: IColumn[]) => void;
}

export function useImportExport(config: IUseImportExportConfig) {
  const { rows, columns, onImport } = config;

  // 导出为 CSV
  const exportAsCSV = useCallback(
    (filename: string = 'export.csv') => {
      const exporter = new CSVExporter();
      exporter.download(rows, columns, filename);
      console.log('[Import/Export] CSV exported:', filename);
    },
    [rows, columns]
  );

  // 导出为 Excel
  const exportAsExcel = useCallback(
    async (filename: string = 'export.xlsx') => {
      const exporter = new ExcelExporter();
      await exporter.download(rows, columns, filename);
      console.log('[Import/Export] Excel exported:', filename);
    },
    [rows, columns]
  );

  // 导入 CSV
  const importCSV = useCallback(
    async (file: File) => {
      const importer = new CSVImporter();
      const result = await importer.importFromFile(file);

      if (result.errors.length > 0) {
        console.error('[Import/Export] CSV import errors:', result.errors);
        alert(`导入出现错误:\n${result.errors.join('\n')}`);
      }

      if (result.rows.length > 0) {
        onImport?.(result.rows, result.columns);
        console.log('[Import/Export] CSV imported:', result);
      }

      return result;
    },
    [onImport]
  );

  // 触发文件选择
  const triggerImport = useCallback(
    (accept: string = '.csv,.xlsx,.xls') => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.name.endsWith('.csv')) {
            await importCSV(file);
          } else {
            alert('Excel 导入将在后续版本支持，当前请使用 CSV 格式');
          }
        }
      };

      input.click();
    },
    [importCSV]
  );

  return {
    exportAsCSV,
    exportAsExcel,
    importCSV,
    triggerImport,
  };
}
