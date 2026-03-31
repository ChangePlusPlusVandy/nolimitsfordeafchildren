import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { Add as AddIcon, Archive as ArchiveIcon, Edit as EditIcon } from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useServerTable } from "../../global/hooks/useServerTable";

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
  const table = useServerTable({ defaultLimit: 20 });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionFormState>({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const { data, isLoading, error } = useQuery({
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
    onSuccess: () => {
      setOpen(false);
      setForm({ name: "", start_date: "", end_date: "", is_active: true });
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const response = await httpClient.patch(`/v1/sessions/${id}`, {
        is_archived: isArchived,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    },
  });

  const sessions = data?.items ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sessions</Typography>
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
      </Stack>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">Failed to load sessions.</Alert>}

      {!isLoading && !error && sessions.length === 0 && (
        <Alert severity="info">No sessions yet. Create your first semester session.</Alert>
      )}

      <Stack spacing={2}>
        {sessions.map((session) => (
          <Card key={session.id} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{session.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={session.is_archived ? "Archived" : session.is_active ? "Active" : "Inactive"}
                      color={session.is_archived ? "default" : session.is_active ? "success" : "warning"}
                      size="small"
                    />
                  </Stack>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {session.start_date} to {session.end_date}
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
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
                    onClick={() =>
                      archiveMutation.mutate({ id: session.id, isArchived: !session.is_archived })
                    }
                    disabled={archiveMutation.isPending}
                  >
                    {session.is_archived ? "Unarchive" : "Archive"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={data?.total ?? 0}
        rowsPerPage={table.limit}
        page={Math.max(table.page - 1, 0)}
        onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
        onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Edit Session" : "Create Session"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name.trim() || !form.start_date || !form.end_date || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
