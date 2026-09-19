"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import {
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TextField,
} from "@mui/material";
import type { ReactNode } from "react";

import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import TableSkeleton from "@/client/components/skeletons/TableSkeleton";

export interface RequestInboxStatusOption<TStatus extends string> {
  value: TStatus | "";
  label: string;
}

export interface RequestInboxProps<TStatus extends string> {
  title: string;
  statusFilter: TStatus | "";
  statusOptions: RequestInboxStatusOption<TStatus>[];
  onStatusFilterChange: (value: TStatus | "") => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isEmpty: boolean;
  emptyIcon: ReactNode;
  emptyDescription: string;
  tableHead: ReactNode;
  children: ReactNode;
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  dialogs?: ReactNode;
}

export default function RequestInbox<TStatus extends string>({
  title,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  onRefresh,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyDescription,
  tableHead,
  children,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  dialogs,
}: RequestInboxProps<TStatus>) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        actions={
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as TStatus | "")}
              sx={{ minWidth: 150 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value || "all"} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <IconButton onClick={onRefresh} aria-label="Refresh requests">
              <RefreshIcon />
            </IconButton>
          </Stack>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorAlert message="Failed to load requests. Please try again." onRetry={onRetry} />
      ) : isEmpty ? (
        <SectionCard>
          <EmptyState icon={emptyIcon} title="No Requests Found" description={emptyDescription} />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <TableContainer>
            <Table>
              <TableHead>{tableHead}</TableHead>
              <TableBody>{children}</TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={Math.max(page - 1, 0)}
            onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
            onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          />
        </SectionCard>
      )}

      {dialogs}
    </PageContainer>
  );
}
