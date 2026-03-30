import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotesIcon from "@mui/icons-material/Notes";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import { useHttpClient } from "../../../plugins/axios";
import { useStudentHttpService } from "../../students/services/StudentHttpService";
import { DetailPageSkeleton } from "../../global/components/skeletons";

interface SessionNote {
  id: string;
  note: string;
  session_date: string | null;
  created_at: string;
  teacher?: {
    name: string;
  };
}

interface Assessment {
  id: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  score: number;
  notes: string | null;
  assessed_at: string;
  teacher?: {
    name: string;
  };
}

interface AssessmentCycle {
  cycle_start_date: string;
  pre_assessment?: Assessment;
  post_assessment?: Assessment;
  improvement?: number;
}

function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 2) days.push("Mon");
  if (mask & 4) days.push("Tue");
  if (mask & 8) days.push("Wed");
  if (mask & 16) days.push("Thu");
  if (mask & 32) days.push("Fri");
  if (mask & 64) days.push("Sat");
  if (mask & 1) days.push("Sun");
  return days;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function TeacherStudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const httpClient = useHttpClient();
  const studentHttpService = useStudentHttpService();

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [noteText, setNoteText] = useState("");

  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState<"pre" | "post">("pre");
  const [assessmentCycleStartDate, setAssessmentCycleStartDate] = useState("");
  const [assessmentFocus, setAssessmentFocus] = useState("");
  const [assessmentScore, setAssessmentScore] = useState("10");
  const [assessmentNotes, setAssessmentNotes] = useState("");

  const {
    data: student,
    isLoading: isStudentLoading,
    error: studentError,
  } = useQuery({
    queryKey: [studentHttpService.key, "show", id, "teacher-scope"],
    queryFn: () => studentHttpService.queries.show(id!),
    enabled: !!id,
  });

  const {
    data: notesData,
    isLoading: isNotesLoading,
    error: notesError,
  } = useQuery({
    queryKey: ["session-notes", id, "teacher-scope"],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/students/${id}/notes`);
      return response.data as { items: SessionNote[] };
    },
    enabled: !!id && !!student,
  });

  const {
    data: assessmentsData,
    isLoading: isAssessmentsLoading,
    error: assessmentsError,
  } = useQuery({
    queryKey: ["assessments", id, "teacher-scope"],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/students/${id}/assessments`);
      return response.data as { items: AssessmentCycle[] };
    },
    enabled: !!id && !!student,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await httpClient.post(`/v1/students/${id}/notes`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", id, "teacher-scope"] });
      setNoteDialogOpen(false);
      setNoteText("");
      setEditingNote(null);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, note }: { noteId: string; note: string }) => {
      const response = await httpClient.patch(`/v1/notes/${noteId}`, { note });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", id, "teacher-scope"] });
      setNoteDialogOpen(false);
      setNoteText("");
      setEditingNote(null);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await httpClient.delete(`/v1/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", id, "teacher-scope"] });
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await httpClient.post(`/v1/students/${id}/assessments`, {
        cycle_start_date: assessmentCycleStartDate,
        assessment_type: assessmentType,
        teaching_focus: assessmentFocus,
        score: Number.parseInt(assessmentScore, 10),
        notes: assessmentNotes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", id, "teacher-scope"] });
      setAssessmentDialogOpen(false);
      setAssessmentType("pre");
      setAssessmentCycleStartDate("");
      setAssessmentFocus("");
      setAssessmentScore("10");
      setAssessmentNotes("");
    },
  });

  const notes = notesData?.items ?? [];
  const assessmentCycles = assessmentsData?.items ?? [];

  const scheduleSummary = useMemo(() => {
    if (!student?.active_schedules || student.active_schedules.length === 0) {
      return "No active schedule assigned";
    }

    return student.active_schedules
      .map(
        (schedule) =>
          `${decodeDayMask(schedule.day_of_week_mask).join("/")} ${schedule.start_time}-${schedule.end_time}`,
      )
      .join(" | ");
  }, [student?.active_schedules]);

  if (isStudentLoading) {
    return <DetailPageSkeleton sections={4} />;
  }

  if (studentError || !student) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">
          {studentError instanceof Error ? studentError.message : "Student not found or access denied"}
        </Alert>
      </Box>
    );
  }

  const attendanceOverview = student.attendance_overview;

  const openAddNoteDialog = () => {
    setEditingNote(null);
    setNoteText("");
    setNoteDialogOpen(true);
  };

  const openEditNoteDialog = (note: SessionNote) => {
    setEditingNote(note);
    setNoteText(note.note);
    setNoteDialogOpen(true);
  };

  const handleNoteSave = () => {
    if (!noteText.trim()) {
      return;
    }

    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, note: noteText });
      return;
    }

    createNoteMutation.mutate(noteText);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Student Details
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.4rem" }}>
                {student.initials}
              </Avatar>
              <Box>
                <Typography variant="h5">{student.initials}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Age {calculateAge(student.dob)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
              Read-Only Schedule
            </Typography>
            <Typography>{scheduleSummary}</Typography>

            {student.active_schedules && student.active_schedules.length > 0 && (
              <List dense sx={{ mt: 1, p: 0 }}>
                {student.active_schedules.map((schedule) => (
                  <ListItem key={schedule.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={`${decodeDayMask(schedule.day_of_week_mask).join("/")} ${schedule.start_time} - ${schedule.end_time}`}
                      secondary={`${schedule.site.name} with ${schedule.teacher.name}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
              <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
              Siblings
            </Typography>
            {student.siblings.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {student.siblings.map((sibling) => (
                  <Chip key={sibling.id} label={sibling.name} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No siblings recorded.</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <NotesIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Session Notes
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={openAddNoteDialog}>
                Add Note
              </Button>
            </Box>

            {isNotesLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {notesError && <Alert severity="error">Failed to load notes.</Alert>}

            {!isNotesLoading && notes.length === 0 && (
              <Typography color="text.secondary">No notes yet.</Typography>
            )}

            {notes.length > 0 && (
              <List sx={{ p: 0 }}>
                {notes.map((note, index) => (
                  <Box key={note.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ px: 0 }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => openEditNoteDialog(note)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                          {note.teacher?.name?.charAt(0) || "T"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={note.note}
                        secondary={new Date(note.created_at).toLocaleString()}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <AssessmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Assessments
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAssessmentDialogOpen(true)}>
                Add Assessment
              </Button>
            </Box>

            {isAssessmentsLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {assessmentsError && <Alert severity="error">Failed to load assessments.</Alert>}

            {!isAssessmentsLoading && assessmentCycles.length === 0 && (
              <Typography color="text.secondary">No assessments yet.</Typography>
            )}

            {assessmentCycles.length > 0 && (
              <List sx={{ p: 0 }}>
                {assessmentCycles.map((cycle, index) => (
                  <Box key={cycle.cycle_start_date}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={`Cycle ${new Date(cycle.cycle_start_date).toLocaleDateString()}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Pre: {cycle.pre_assessment ? `${cycle.pre_assessment.score}/20` : "-"}
                            </Typography>
                            <Typography component="span" variant="body2" sx={{ ml: 1.5 }}>
                              Post: {cycle.post_assessment ? `${cycle.post_assessment.score}/20` : "-"}
                            </Typography>
                            {typeof cycle.improvement === "number" && (
                              <Typography component="span" variant="body2" sx={{ ml: 1.5 }}>
                                Improvement: {cycle.improvement > 0 ? `+${cycle.improvement}` : cycle.improvement}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        <Box sx={{ width: { xs: "100%", lg: 360 } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <EventAvailableIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Attendance Summary
            </Typography>

            {attendanceOverview ? (
              <Stack spacing={1}>
                <Chip label={`Present: ${attendanceOverview.present}`} color="success" size="small" />
                <Chip label={`No-show: ${attendanceOverview.no_show}`} color="error" size="small" />
                <Chip label={`Cancelled: ${attendanceOverview.cancelled}`} size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                  Attendance rate: {attendanceOverview.attendance_rate}% ({attendanceOverview.total} total)
                </Typography>

                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Recent Entries</Typography>
                {attendanceOverview.recent_entries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No attendance entries.
                  </Typography>
                ) : (
                  <List dense sx={{ p: 0 }}>
                    {attendanceOverview.recent_entries.map((entry) => (
                      <ListItem key={entry.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={new Date(entry.session_date).toLocaleDateString()}
                          secondary={
                            <Chip
                              size="small"
                              label={entry.status.replace("_", " ")}
                              color={
                                (entry.status === "present"
                                  ? "success"
                                  : entry.status === "no_show"
                                    ? "error"
                                    : "default") as "success" | "error" | "default"
                              }
                              sx={{ textTransform: "capitalize" }}
                            />
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">Attendance data unavailable.</Typography>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNote ? "Edit Session Note" : "Add Session Note"}</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={noteText}
            onChange={(event) =>
              setNoteText((event.target as unknown as { value: string }).value)
            }
            placeholder="Enter note..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleNoteSave}
            disabled={
              !noteText.trim() || createNoteMutation.isPending || updateNoteMutation.isPending
            }
          >
            {createNoteMutation.isPending || updateNoteMutation.isPending ? (
              <CircularProgress size={20} />
            ) : editingNote ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assessmentDialogOpen}
        onClose={() => setAssessmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Assessment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Assessment Type"
              value={assessmentType}
              onChange={(event) =>
                setAssessmentType((event.target as unknown as { value: "pre" | "post" }).value)
              }
            >
              <MenuItem value="pre">Pre</MenuItem>
              <MenuItem value="post">Post</MenuItem>
            </TextField>

            <TextField
              type="date"
              label="Cycle Start Date"
              value={assessmentCycleStartDate}
              onChange={(event) =>
                setAssessmentCycleStartDate((event.target as unknown as { value: string }).value)
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Teaching Focus"
              value={assessmentFocus}
              onChange={(event) =>
                setAssessmentFocus((event.target as unknown as { value: string }).value)
              }
            />

            <TextField
              type="number"
              label="Score (0-20)"
              value={assessmentScore}
              onChange={(event) =>
                setAssessmentScore((event.target as unknown as { value: string }).value)
              }
              inputProps={{ min: 0, max: 20 }}
            />

            <TextField
              multiline
              rows={3}
              label="Notes"
              value={assessmentNotes}
              onChange={(event) =>
                setAssessmentNotes((event.target as unknown as { value: string }).value)
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createAssessmentMutation.mutate()}
            disabled={
              createAssessmentMutation.isPending ||
              !assessmentCycleStartDate ||
              !assessmentFocus.trim() ||
              Number.parseInt(assessmentScore, 10) < 0 ||
              Number.parseInt(assessmentScore, 10) > 20
            }
          >
            {createAssessmentMutation.isPending ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
