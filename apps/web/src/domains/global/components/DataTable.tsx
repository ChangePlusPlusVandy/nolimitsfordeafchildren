import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { TableSkeleton } from "./skeletons";

export interface DataTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps {
  columns: DataTableColumn[];
  loading: boolean;
  error?: unknown;
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  emptyMessage?: string;
  children: ReactNode;
}

export function DataTable({
  columns,
  loading,
  error,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "No results found",
  children,
}: DataTableProps) {
  if (loading) {
    return <TableSkeleton columns={columns.length} rows={8} />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load records.
      </Alert>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align ?? "left"}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{children}</TableBody>
        </Table>
      </TableContainer>

      {total === 0 && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      )}

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={Math.max(page - 1, 0)}
        onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
      />
    </Paper>
  );
}
