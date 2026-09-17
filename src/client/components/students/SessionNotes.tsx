"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NotesIcon from "@mui/icons-material/Notes";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ConfirmDialog from "@/client/components/ConfirmDialog";
import ErrorAlert from "@/client/components/ErrorAlert";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import {
  createNote,
  deleteNote,
  listNotesForStudent,
  type SessionNote,
  updateNote,
} from "@/client/notes";
import { formatDate, formatDateTime } from "@/client/utils/formatDate";

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
    queryFn: () => listNotesForStudent(studentId, { page, limit: rowsPerPage }),
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: (note: string) => createNote(studentId, note),
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
    mutationFn: ({ id, note }: { id: string; note: string }) => updateNote(id, note),
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
    mutationFn: (id: string) => deleteNote(id),
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

        {error && <ErrorAlert message="Failed to load notes." onRetry={() => refetch()} />}

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
                    slotProps={{
                      primary: { sx: { whiteSpace: "pre-wrap", pr: canEdit ? 8 : 0 } },
                    }}
                    secondary={note.session_date && `Session: ${formatDate(note.session_date)}`}
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
