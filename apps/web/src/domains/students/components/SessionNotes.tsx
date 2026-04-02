import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Chip,
  Stack,
  TablePagination,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import ConfirmDialog from "../../global/components/ConfirmDialog";
import { formatDateTime, formatDate } from "../../../utils/formatDate";

interface SessionNote {
  id: string;
  student_id: string;
  teacher_id: string;
  schedule_id: string | null;
  session_date: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
  };
}

interface SessionNotesProps {
  studentId: string;
  canAdd?: boolean; // Teachers can add
  canEdit?: boolean; // Teachers can edit their own
}

export default function SessionNotes({
  studentId,
  canAdd = false,
  canEdit = false,
}: SessionNotesProps) {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [noteText, setNoteText] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Fetch notes
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["session-notes", studentId, page, rowsPerPage],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/students/${studentId}/notes`, {
        params: {
          page,
          limit: rowsPerPage,
        },
      });
      return response.data as {
        items: SessionNote[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await httpClient.post(`/v1/students/${studentId}/notes`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", studentId] });
      toast.success("Session note added");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to add session note");
    },
  });

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const response = await httpClient.patch(`/v1/notes/${id}`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", studentId] });
      toast.success("Session note updated");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to update session note");
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(`/v1/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", studentId] });
      toast.success("Session note deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete session note");
      setDeleteTarget(null);
    },
  });

  const handleOpenDialog = (note?: SessionNote) => {
    if (note) {
      setEditingNote(note);
      setNoteText(note.note);
    } else {
      setEditingNote(null);
      setNoteText("");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNote(null);
    setNoteText("");
  };

  const handleSave = () => {
    if (!noteText.trim()) return;

    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, note: noteText });
    } else {
      createMutation.mutate(noteText);
    }
  };

  const notes = data?.items ?? [];

  return (
    <>
      <SectionCard
        title="Session Notes"
        icon={<NotesIcon />}
        actions={
          canAdd ? (
            <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Note
            </Button>
          ) : undefined
        }
      >
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <ErrorAlert message="Failed to load notes." onRetry={() => refetch()} />
        )}

        {!isLoading && !error && notes.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No session notes recorded yet.
          </Typography>
        )}

        {notes.length > 0 && (
          <>
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {notes.map((note) => (
                <ListItem
                  key={note.id}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                  secondaryAction={
                    canEdit && (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(note)}
                          aria-label="Edit note"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(note.id)}
                          aria-label="Delete note"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, width: "100%" }}>
                    <Avatar
                      sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}
                    >
                      {note.teacher?.name?.charAt(0) || "T"}
                    </Avatar>
                    <Typography variant="subtitle2">{note.teacher?.name || "Teacher"}</Typography>
                    <Chip
                      label={formatDateTime(note.created_at)}
                      size="small"
                      variant="outlined"
                      sx={{ ml: "auto" }}
                    />
                  </Box>
                  <ListItemText
                    primary={note.note}
                    primaryTypographyProps={{
                      sx: { whiteSpace: "pre-wrap", pr: canEdit ? 8 : 0 },
                    }}
                    secondary={
                      note.session_date && `Session: ${formatDate(note.session_date)}`
                    }
                  />
                </ListItem>
              ))}
            </List>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20]}
              component="div"
              count={data?.total ?? 0}
              rowsPerPage={rowsPerPage}
              page={Math.max(page - 1, 0)}
              onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
            />
          </>
        )}
      </SectionCard>

      {/* Add/Edit Note Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNote ? "Edit Note" : "Add Session Note"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Note"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter your session note here..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!noteText.trim() || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={20} />
            ) : editingNote ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete note?"
        message="Are you sure you want to delete this session note? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
