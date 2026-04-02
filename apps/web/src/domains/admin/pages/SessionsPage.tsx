import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useServerTable } from "../../global/hooks/useServerTable";
import { useToast } from "../../global/components/ToastProvider";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import ConfirmDialog from "../../global/components/ConfirmDialog";
import CardGridSkeleton from "../../global/components/skeletons/CardGridSkeleton";
import { formatDate } from "../../../utils/formatDate";

interface SessionItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
}

interface SessionFormState {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function SessionsPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  const table = useServerTable({ defaultLimit: 20 });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionFormState>({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const [archiveConfirm, setArchiveConfirm] = useState<{
    session: SessionItem;
    isArchiving: boolean;
  } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-sessions", table.page, table.limit],
    queryFn: async () => {
      const response = await httpClient.get("/v1/sessions", {
        params: { include_archived: true, page: table.page, limit: table.limit },
      });
      return response.data as {
        items: SessionItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SessionFormState) => {
      if (payload.id) {
        const response = await httpClient.patch(`/v1/sessions/${payload.id}`, {
          name: payload.name,
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: payload.is_active,
        });
        return response.data;
      }

      const response = await httpClient.post("/v1/sessions", payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      setOpen(false);
      setForm({ name: "", start_date: "", end_date: "", is_active: true });
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      toast.success(variables.id ? "Session updated successfully" : "Session created successfully");
    },
    onError: (_error, variables) => {
      toast.error(variables.id ? "Failed to update session" : "Failed to create session");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const response = await httpClient.patch(`/v1/sessions/${id}`, {
        is_archived: isArchived,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      toast.success(variables.isArchived ? "Session archived" : "Session unarchived");
      setArchiveConfirm(null);
    },
    onError: () => {
      toast.error("Failed to update session");
      setArchiveConfirm(null);
    },
  });

  const sessions = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Sessions"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setForm({ name: "", start_date: "", end_date: "", is_active: true });
              setOpen(true);
            }}
          >
            New Session
          </Button>
        }
      />

      {isLoading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorAlert
          message="Failed to load sessions."
          onRetry={() => refetch()}
        />
      ) : sessions.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<CalendarIcon sx={{ fontSize: 48 }} />}
            title="No Sessions Yet"
            description="Create your first semester session to get started."
            actionLabel="New Session"
            onAction={() => {
              setForm({ name: "", start_date: "", end_date: "", is_active: true });
              setOpen(true);
            }}
          />
        </SectionCard>
      ) : (
        <Stack spacing={2}>
          {sessions.map((session) => (
            <SectionCard key={session.id}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{session.name}</Typography>
                  <Chip
                    label={
                      session.is_archived
                        ? "Archived"
                        : session.is_active
                          ? "Active"
                          : "Inactive"
                    }
                    color={
                      session.is_archived
                        ? "default"
                        : session.is_active
                          ? "success"
                          : "warning"
                    }
                    size="small"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {formatDate(session.start_date)} to {formatDate(session.end_date)}
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    aria-label={`Edit ${session.name}`}
                    onClick={() => {
                      setForm({
                        id: session.id,
                        name: session.name,
                        start_date: session.start_date,
                        end_date: session.end_date,
                        is_active: session.is_active,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color={session.is_archived ? "success" : "warning"}
                    startIcon={<ArchiveIcon />}
                    aria-label={session.is_archived ? `Unarchive ${session.name}` : `Archive ${session.name}`}
                    onClick={() =>
                      setArchiveConfirm({
                        session,
                        isArchiving: !session.is_archived,
                      })
                    }
                  >
                    {session.is_archived ? "Unarchive" : "Archive"}
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      {sessions.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={data?.total ?? 0}
          rowsPerPage={table.limit}
          page={Math.max(table.page - 1, 0)}
          onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
        />
      )}

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={!!archiveConfirm}
        title={archiveConfirm?.isArchiving ? "Archive Session?" : "Unarchive Session?"}
        message={
          archiveConfirm?.isArchiving
            ? `Are you sure you want to archive "${archiveConfirm.session.name}"? Archived sessions are hidden from regular views.`
            : `Are you sure you want to unarchive "${archiveConfirm?.session.name}"?`
        }
        confirmLabel={archiveConfirm?.isArchiving ? "Archive" : "Unarchive"}
        confirmColor={archiveConfirm?.isArchiving ? "warning" : "primary"}
        loading={archiveMutation.isPending}
        onConfirm={() => {
          if (archiveConfirm) {
            archiveMutation.mutate({
              id: archiveConfirm.session.id,
              isArchived: archiveConfirm.isArchiving,
            });
          }
        }}
        onCancel={() => setArchiveConfirm(null)}
      />

      {/* Create/Edit Session Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Session" : "Create Session"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Session name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: (event.target as unknown as { value: string }).value,
                }))
              }
              placeholder="Fall 2026"
              fullWidth
            />
            <TextField
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  start_date: (event.target as unknown as { value: string }).value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  end_date: (event.target as unknown as { value: string }).value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.is_active}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: (event.target as unknown as { checked: boolean }).checked,
                  }))
                }
              />
              <Typography variant="body2">Active session</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate(form)}
            disabled={
              !form.name.trim() || !form.start_date || !form.end_date || saveMutation.isPending
            }
          >
            {saveMutation.isPending ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
