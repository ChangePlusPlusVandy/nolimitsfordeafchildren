import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { TableSkeleton } from "./skeletons";
import ErrorAlert from "./ErrorAlert";
import EmptyState from "./EmptyState";

export interface DataTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Hide this column at the given breakpoint and below. */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps {
  columns: DataTableColumn[];
  loading: boolean;
  error?: unknown;
  /** Called when the user clicks "Retry" on the error alert. */
  onRetry?: () => void;
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Enhanced DataTable with:
 * - SectionCard wrapper (white Paper on grey background)
 * - Responsive column hiding via `hideBelow`
 * - ErrorAlert with retry button
 * - EmptyState with icon + description
 */
export function DataTable({
  columns,
  loading,
  error,
  onRetry,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  emptyTitle = "No results found",
  emptyDescription,
  emptyIcon,
  children,
}: DataTableProps) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={8} />;
  }

  if (error) {
    return (
      <ErrorAlert
        message="Failed to load records."
        onRetry={onRetry}
      />
    );
  }

  const shouldHide = (col: DataTableColumn): boolean => {
    if (!col.hideBelow) return false;
    if (col.hideBelow === "sm") return isSmDown;
    if (col.hideBelow === "md") return isMdDown;
    if (col.hideBelow === "lg") return isLgDown;
    return false;
  };

  const visibleColumns = columns.filter((col) => !shouldHide(col));

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
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
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
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

/**
 * Utility hook: returns a function to check if a column should be hidden.
 * Useful in table row rendering to skip cells for hidden columns.
 */
export function useResponsiveColumns(columns: DataTableColumn[]) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));

  const isHidden = (col: DataTableColumn): boolean => {
    if (!col.hideBelow) return false;
    if (col.hideBelow === "sm") return isSmDown;
    if (col.hideBelow === "md") return isMdDown;
    if (col.hideBelow === "lg") return isLgDown;
    return false;
  };

  return {
    visibleColumns: columns.filter((col) => !isHidden(col)),
    isHidden,
  };
}
