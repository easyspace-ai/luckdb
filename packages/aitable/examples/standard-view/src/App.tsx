import { useMemo, useState, useCallback } from "react";
import { StandardDataView, type IGridColumn, CellType } from "../../dist/index.js";

function App() {
  const [rows] = useState(50);
  const columns: IGridColumn[] = useMemo(() => ([
    { id: "id", name: "ID", width: 80, isPrimary: true },
    { id: "title", name: "标题", width: 220 },
    { id: "number", name: "数字", width: 120 },
    { id: "status", name: "状态", width: 120 },
  ]), []);

  const getCellContent = useCallback((cell: [number, number]) => {
    const [col, row] = cell;
    const column = columns[col];
    switch (column.id) {
      case "id":
        return { type: CellType.Text, data: `R${row + 1}`, displayData: `R${row + 1}` };
      case "title":
        return { type: CellType.Text, data: `记录 ${row + 1}`, displayData: `记录 ${row + 1}` };
      case "number":
        return { type: CellType.Number, data: (row + 1) * 3, displayData: String((row + 1) * 3) };
      case "status":
        return { type: CellType.Select, data: [row % 2 ? "进行中" : "待处理"], displayData: [row % 2 ? "进行中" : "待处理"], choiceMap: { 待处理: { id: "待处理", name: "待处理", color: "#64748b" }, 进行中: { id: "进行中", name: "进行中", color: "#3b82f6" } }, choiceSorted: [{ id: "待处理", name: "待处理", color: "#64748b" }, { id: "进行中", name: "进行中", color: "#3b82f6" }], isMultiple: false };
      default:
        return { type: CellType.Text, data: "", displayData: "" };
    }
  }, [columns]);

  return (
    <div className="h-screen">
      <StandardDataView
        showHeader
        showToolbar
        showStatus
        toolbarConfig={{ showShare: true, showAPI: true }}
        gridProps={{ columns, rowCount: rows, getCellContent }}
        statusContent={<span>示例状态栏</span>}
      />
    </div>
  );
}

export default App;
