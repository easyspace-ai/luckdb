import { useTableStore } from '../store/tableStore';

export function useTables() {
  const { tables, currentTable, setTables, setCurrentTable, addTable, removeTable } =
    useTableStore();

  return {
    tables,
    currentTable,
    setTables,
    setCurrentTable,
    addTable,
    removeTable,
  };
}

