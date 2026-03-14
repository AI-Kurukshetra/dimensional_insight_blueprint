import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  rows,
  className
}: {
  columns: string[];
  rows: Array<Array<string | number | null>>;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-white", className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-left font-medium text-slate-700">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/70">
              {row.map((value, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 text-slate-600">
                  {value ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
