
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ResultsPreviewProps {
  data?: {
    columns: string[];
    rows: any[][];
    total_rows?: number;
  };
  loading?: boolean;
  error?: string;
}

const ResultsPreview: React.FC<ResultsPreviewProps> = ({ 
  data, 
  loading = false,
  error
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Executing query...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-destructive/10 rounded-md border border-destructive/20">
        <p className="text-destructive font-medium mb-2">Error executing query</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="text-center py-16 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">
          No data to display. Execute a query to see results.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 p-2 px-4 border-b">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Results</span>
          <span className="text-xs text-muted-foreground">
            Showing {data.rows.length} of {data.total_rows || data.rows.length} rows
          </span>
        </div>
      </div>

      <ScrollArea className="h-[400px] custom-scrollbar">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((column, idx) => (
                  <TableHead key={`col-${idx}`}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, rowIdx) => (
                <TableRow key={`row-${rowIdx}`}>
                  {row.map((cell, cellIdx) => (
                    <TableCell key={`cell-${rowIdx}-${cellIdx}`}>
                      {cell === null || cell === undefined ? <span className="text-muted-foreground italic">null</span> : String(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResultsPreview;
