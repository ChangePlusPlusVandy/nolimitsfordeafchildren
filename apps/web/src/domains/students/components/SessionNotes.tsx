import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
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
  Alert,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useHttpClient } from "../../../plugins/axios";

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [noteText, setNoteText] = useState("");

  // Fetch notes
  const { data, isLoading, error } = useQuery({
    queryKey: ["session-notes", studentId],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/students/${studentId}/notes`);
      return response.data as { items: SessionNote[] };
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
      handleCloseDialog();
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
      handleCloseDialog();
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(`/v1/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", studentId] });
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const notes = data?.items ?? [];

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">
          <NotesIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Session Notes
        </Typography>
        {canAdd && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Note
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load notes. Please try again.
        </Alert>
      )}

      {!isLoading && notes.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No session notes recorded yet.
        </Typography>
      )}

      {notes.length > 0 && (
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
                    <IconButton size="small" onClick={() => handleOpenDialog(note)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(note.id)}>
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
                  label={formatDate(note.created_at)}
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
                  note.session_date &&
                  `Session: ${new Date(note.session_date).toLocaleDateString()}`
                }
              />
            </ListItem>
          ))}
        </List>
      )}

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
        <DialogActions>
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
    </Paper>
  );
}
