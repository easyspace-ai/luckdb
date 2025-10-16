import { create } from 'zustand';
import type { Table } from '../types';

interface TableState {
  tables: Table[];
  currentTable: Table | null;
  setTables: (tables: Table[]) => void;
  setCurrentTable: (table: Table) => void;
  addTable: (table: Table) => void;
  removeTable: (id: string) => void;
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  currentTable: null,
  setTables: (tables) => set({ tables }),
  setCurrentTable: (table) => set({ currentTable: table }),
  addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
  removeTable: (id) => set((state) => ({ tables: state.tables.filter((t) => t.id !== id) })),
}));

