import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import { useHttpClient } from "../../../plugins/axios";
import { useStudentHttpService } from "../../students/services/StudentHttpService";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import DocumentList from "../../students/components/DocumentList";
import UploadDocumentModal from "../../students/pages/UploadDocumentModal";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import ConfirmDialog from "../../global/components/ConfirmDialog";
import { useToast } from "../../global/components/ToastProvider";
import { formatDate, formatDateTime } from "../../../utils/formatDate";

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
  summary: string | null;
  focuses?: Array<{
    id?: string;
    goal: string;
    score: number;
    max_score: number;
    sort_order?: number;
  }>;
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
  const [assessmentFocuses, setAssessmentFocuses] = useState<
    Array<{ goal: string; score: number; max_score: number }>
  >([{ goal: "", score: 0, max_score: 10 }]);
  const [assessmentScore, setAssessmentScore] = useState("10");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"pre_report" | "graduation_speech" | null>(null);
  const [guardianSummaryEditOpen, setGuardianSummaryEditOpen] = useState(false);
  const [guardianSummaryDraft, setGuardianSummaryDraft] = useState("");
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<string | null>(null);
  const toast = useToast();

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
      const response = await httpClient.get(`/v1/students/${id}/notes`, {
        params: {
          page: 1,
          limit: 100,
        },
      });
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
      const response = await httpClient.get(`/v1/students/${id}/assessments`, {
        params: {
          page: 1,
          limit: 100,
        },
      });
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
      toast.success("Note saved");
    },
    onError: () => {
      toast.error("Failed to save note");
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
      toast.success("Note updated");
    },
    onError: () => {
      toast.error("Failed to update note");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await httpClient.delete(`/v1/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-notes", id, "teacher-scope"] });
      setDeleteNoteTarget(null);
      toast.success("Note deleted");
    },
    onError: () => {
      toast.error("Failed to delete note");
    },
  });

  const updateGuardianSummaryMutation = useMutation({
    mutationFn: async (guardianSummary: string) => {
      const response = await httpClient.patch(`/v1/students/${id}/guardian-summary`, {
        guardian_summary: guardianSummary.trim() || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", id] });
      setGuardianSummaryEditOpen(false);
      toast.success("Guardian summary updated");
    },
    onError: () => {
      toast.error("Failed to update guardian summary");
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const normalizedFocuses = assessmentFocuses
        .map((focus) => ({
          goal: focus.goal.trim(),
          score: Number(focus.score),
          max_score: Number(focus.max_score),
        }))
        .filter((focus) => focus.goal.length > 0);

      const response = await httpClient.post(`/v1/students/${id}/assessments`, {
        cycle_start_date: assessmentCycleStartDate,
        assessment_type: assessmentType,
        teaching_focus:
          normalizedFocuses.length > 0
            ? normalizedFocuses.map((focus) => focus.goal).join(" | ")
            : assessmentFocus,
        focuses: normalizedFocuses,
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
      setAssessmentFocuses([{ goal: "", score: 0, max_score: 10 }]);
      setAssessmentScore("10");
      setAssessmentNotes("");
      toast.success("Assessment saved");
    },
    onError: () => {
      toast.error("Failed to save assessment");
    },
  });

  const cloneAssessmentMutation = useMutation({
    mutationFn: async ({
      id,
      assessment_type,
      cycle_start_date,
    }: {
      id: string;
      assessment_type: "pre" | "post";
      cycle_start_date: string;
    }) => {
      const response = await httpClient.post(`/v1/assessments/${id}/clone`, {
        assessment_type,
        cycle_start_date,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", id, "teacher-scope"] });
      toast.success("Assessment cloned");
    },
    onError: () => {
      toast.error("Failed to clone assessment");
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
      <PageContainer>
        <PageHeader title="Student Details" back="/my-day" breadcrumbs={[{ label: "My Day", href: "/my-day" }, { label: "Student Details" }]} />
        <ErrorAlert
          message={studentError instanceof Error ? studentError.message : "Student not found or access denied"}
        />
      </PageContainer>
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

  const openGuardianSummaryDialog = () => {
    setGuardianSummaryDraft(student.guardian_summary || "");
    setGuardianSummaryEditOpen(true);
  };

  const handleGuardianSummarySave = () => {
    updateGuardianSummaryMutation.mutate(guardianSummaryDraft);
  };

  return (
    <PageContainer>
      <PageHeader title="Student Details" back="/my-day" breadcrumbs={[{ label: "My Day", href: "/my-day" }, { label: "Student Details" }]} />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
          <SectionCard title="Profile" icon={<PersonIcon />}>
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

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Guardian Summary
              </Typography>
              <Button size="small" startIcon={<EditIcon />} onClick={openGuardianSummaryDialog}>
                Edit
              </Button>
            </Box>
            <Typography>
              {student.guardian_summary?.trim() ? student.guardian_summary : "No guardian summary recorded."}
            </Typography>
          </SectionCard>

          <SectionCard
            title="Documents"
            icon={<DescriptionIcon />}
            actions={
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setUploadType("pre_report");
                    setUploadModalOpen(true);
                  }}
                >
                  Pre-Report
                </Button>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setUploadType("graduation_speech");
                    setUploadModalOpen(true);
                  }}
                >
                  Speech
                </Button>
              </Stack>
            }
          >
            <DocumentList studentId={id!} reviewStatusFilter="approved" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Pre-reports and graduation speeches appear here after admin approval.
            </Typography>
          </SectionCard>

          <SectionCard
            title="Session Notes"
            icon={<NotesIcon />}
            actions={
              <Button size="small" startIcon={<AddIcon />} onClick={openAddNoteDialog}>
                Add Note
              </Button>
            }
          >

            {isNotesLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {notesError && (
              <ErrorAlert
                message="Failed to load notes."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["session-notes", id, "teacher-scope"] })}
              />
            )}

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
                          <IconButton size="small" onClick={() => openEditNoteDialog(note)} aria-label="Edit note">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteNoteTarget(note.id)}
                            aria-label="Delete note"
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
                        secondary={formatDateTime(note.created_at)}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </SectionCard>

          <SectionCard
            title="Assessments"
            icon={<AssessmentIcon />}
            actions={
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAssessmentDialogOpen(true)}>
                Add Assessment
              </Button>
            }
          >

            {isAssessmentsLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {assessmentsError && (
              <ErrorAlert
                message="Failed to load assessments."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["assessments", id, "teacher-scope"] })}
              />
            )}

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
                        primary={`Cycle ${formatDate(cycle.cycle_start_date)}`}
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
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {cycle.pre_assessment && (
                              <Button
                                size="small"
                                startIcon={<ContentCopyIcon fontSize="small" />}
                                onClick={(event) => {
                                  event.preventDefault();
                                  cloneAssessmentMutation.mutate({
                                    id: cycle.pre_assessment!.id,
                                    assessment_type: "post",
                                    cycle_start_date: cycle.cycle_start_date,
                                  });
                                }}
                              >
                                Clone Pre to Post
                              </Button>
                            )}
                            {cycle.post_assessment && (
                              <Button
                                size="small"
                                startIcon={<ContentCopyIcon fontSize="small" />}
                                onClick={(event) => {
                                  event.preventDefault();
                                  cloneAssessmentMutation.mutate({
                                    id: cycle.post_assessment!.id,
                                    assessment_type: "pre",
                                    cycle_start_date: cycle.cycle_start_date,
                                  });
                                }}
                              >
                                Clone Post to Pre
                              </Button>
                            )}
                          </Stack>
                          {(cycle.post_assessment?.focuses?.length || cycle.pre_assessment?.focuses?.length) && (
                            <Typography component="div" variant="body2" sx={{ mt: 0.5 }}>
                              Focuses: {(cycle.post_assessment?.focuses || cycle.pre_assessment?.focuses || [])
                                  .map((focus) => `${focus.goal} (${focus.score}/${focus.max_score})`)
                                  .join("; ")}
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
          </SectionCard>
          </Stack>
        </Box>

        <Box sx={{ width: { xs: "100%", lg: 360 } }}>
          <SectionCard title="Attendance Summary" icon={<EventAvailableIcon />}>

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
                          primary={formatDate(entry.session_date)}
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
          </SectionCard>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
          <Stack spacing={2.5} sx={{ mt: 1 }}>
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

            <Stack spacing={1}>
              <Typography variant="subtitle2">Teaching Focuses (up to 4)</Typography>
              {assessmentFocuses.map((focus, index) => (
                <Box key={`teacher-focus-${index}`} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 1 }}>
                  <TextField
                    label={`Goal ${index + 1}`}
                    value={focus.goal}
                    onChange={(event) => {
                      const next = [...assessmentFocuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        goal: (event.target as unknown as { value: string }).value,
                      };
                      setAssessmentFocuses(next);
                    }}
                  />
                  <TextField
                    type="number"
                    label="Score"
                    value={focus.score}
                    onChange={(event) => {
                      const next = [...assessmentFocuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        score: Number((event.target as unknown as { value: string }).value),
                      };
                      setAssessmentFocuses(next);
                    }}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    type="number"
                    label="Max"
                    value={focus.max_score}
                    onChange={(event) => {
                      const next = [...assessmentFocuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        max_score: Number((event.target as unknown as { value: string }).value),
                      };
                      setAssessmentFocuses(next);
                    }}
                    inputProps={{ min: 1 }}
                  />
                  <Button
                    color="error"
                    onClick={() => {
                      if (assessmentFocuses.length === 1) {
                        setAssessmentFocuses([{ goal: "", score: 0, max_score: 10 }]);
                        return;
                      }
                      setAssessmentFocuses(
                        assessmentFocuses.filter((_, focusIndex) => focusIndex !== index),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Box>
                <Button
                  size="small"
                  onClick={() => {
                    if (assessmentFocuses.length >= 4) return;
                    setAssessmentFocuses([
                      ...assessmentFocuses,
                      { goal: "", score: 0, max_score: 10 },
                    ]);
                  }}
                  disabled={assessmentFocuses.length >= 4}
                >
                  Add Focus
                </Button>
              </Box>
            </Stack>

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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createAssessmentMutation.mutate()}
            disabled={
              createAssessmentMutation.isPending ||
              !assessmentCycleStartDate ||
              Number.parseInt(assessmentScore, 10) < 0 ||
              Number.parseInt(assessmentScore, 10) > 20
            }
          >
            {createAssessmentMutation.isPending ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadType(null);
        }}
        studentId={id!}
        studentName={`${student.first_name} ${student.last_name}`}
        defaultDocumentType={uploadType ?? undefined}
      />

      <Dialog
        open={guardianSummaryEditOpen}
        onClose={() => setGuardianSummaryEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Guardian Summary</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={5}
            fullWidth
            value={guardianSummaryDraft}
            onChange={(event) =>
              setGuardianSummaryDraft((event.target as unknown as { value: string }).value)
            }
            placeholder="Add relevant guardian/family context for staff"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGuardianSummaryEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGuardianSummarySave}
            disabled={updateGuardianSummaryMutation.isPending}
          >
            {updateGuardianSummaryMutation.isPending ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteNoteTarget !== null}
        title="Delete Note"
        message="Are you sure you want to delete this session note? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteNoteMutation.isPending}
        onConfirm={() => {
          if (deleteNoteTarget) deleteNoteMutation.mutate(deleteNoteTarget);
        }}
        onCancel={() => setDeleteNoteTarget(null)}
      />
    </PageContainer>
  );
}
