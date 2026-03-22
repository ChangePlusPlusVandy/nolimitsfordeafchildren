import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Stack,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Block as BlockIcon,
  Undo as UndoIcon,
} from "@mui/icons-material";
import {
  useTeacherHttpService,
  type SessionForDay,
  type MyDayResponse,
  type AttendanceStatus,
  type AbsenceReason,
} from "../services/TeacherHttpService";
import { useHttpClient } from "../../../plugins/axios";

const ABSENCE_REASONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "transportation", label: "Transportation Issue" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "no_show_unknown", label: "No Show (Unknown)" },
  { value: "other", label: "Other" },
];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getStatusColor(status: AttendanceStatus | undefined): "success" | "error" | "default" {
  switch (status) {
    case "present":
      return "success";
    case "no_show":
      return "error";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

function getStatusLabel(status: AttendanceStatus | undefined): string {
  switch (status) {
    case "present":
      return "Present";
    case "no_show":
      return "No Show";
    case "cancelled":
      return "Cancelled";
    default:
      return "Not Marked";
  }
}

export default function MyDayPage() {
  const navigate = useNavigate();
  const teacherHttpService = useTeacherHttpService();
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();

  const [selectedDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionForDay | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | "">("");
  const [reasonText, setReasonText] = useState("");
  const [undoSnackbar, setUndoSnackbar] = useState<{
    open: boolean;
    session: SessionForDay | null;
    previousStatus: AttendanceStatus | null;
  }>({ open: false, session: null, previousStatus: null });

  const { data, isLoading, error } = useQuery<MyDayResponse>({
    queryKey: [teacherHttpService.key, "myDay", selectedDate],
    queryFn: () => teacherHttpService.queries.myDay({ date: selectedDate }),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      student_id,
      schedule_id,
      session_date,
      status,
      reason,
      reason_text,
    }: {
      student_id: string;
      schedule_id: string;
      session_date: string;
      status: AttendanceStatus;
      reason?: AbsenceReason;
      reason_text?: string;
    }) => {
      const response = await httpClient.post("/v1/attendance", {
        student_id,
        schedule_id,
        session_date,
        status,
        reason,
        reason_text,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "myDay"] });
    },
  });

  const handleMarkAttendance = (session: SessionForDay, status: AttendanceStatus) => {
    // Store previous state for undo
    const previousStatus = session.attendance?.status || null;

    if (status === "present") {
      // Mark as present directly
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: selectedDate,
        status: "present",
      });

      // Show undo snackbar
      setUndoSnackbar({
        open: true,
        session,
        previousStatus,
      });
    } else {
      // Open dialog to select reason
      setSelectedSession(session);
      setSelectedStatus(status);
      setSelectedReason("");
      setReasonText("");
      setReasonDialogOpen(true);
    }
  };

  const handleConfirmAbsence = () => {
    if (!selectedSession || !selectedStatus || !selectedReason) return;

    const previousStatus = selectedSession.attendance?.status || null;

    markAttendanceMutation.mutate({
      student_id: selectedSession.student_id,
      schedule_id: selectedSession.schedule_id,
      session_date: selectedDate,
      status: selectedStatus,
      reason: selectedReason,
      reason_text: selectedReason === "other" ? reasonText : undefined,
    });

    setReasonDialogOpen(false);
    setUndoSnackbar({
      open: true,
      session: selectedSession,
      previousStatus,
    });
  };

  const handleUndo = () => {
    if (!undoSnackbar.session) return;

    const { session, previousStatus } = undoSnackbar;

    if (previousStatus) {
      // Restore previous status
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: selectedDate,
        status: previousStatus,
      });
    }
    // Note: If there was no previous attendance, we can't truly "undo" - just close the snackbar
    // In a production app, you might want a DELETE endpoint for this case

    setUndoSnackbar({ open: false, session: null, previousStatus: null });
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Day
          </Typography>
          <Skeleton variant="text" width={200} />
        </Box>
        {/* Session cards skeleton */}
        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2, bgcolor: "grey.100" }}>
            <Skeleton variant="text" width={150} />
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} variant="outlined">
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Skeleton variant="circular" width={48} height={48} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="25%" />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Skeleton variant="rounded" width={80} height={32} />
                        <Skeleton variant="rounded" width={80} height={32} />
                        <Skeleton variant="rounded" width={90} height={32} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load today's sessions. Please try again.</Alert>;
  }

  const sessions = data?.sessions || [];
  const markedCount = sessions.filter((s) => s.attendance).length;
  const totalCount = sessions.length;

  // Group sessions by site
  const sessionsBySite = sessions.reduce(
    (acc, session) => {
      if (!acc[session.site_id]) {
        acc[session.site_id] = {
          site_name: session.site_name,
          sessions: [],
        };
      }
      acc[session.site_id]!.sessions.push(session);
      return acc;
    },
    {} as Record<string, { site_name: string; sessions: SessionForDay[] }>,
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Day
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>
      </Box>

      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No sessions scheduled for today.</Typography>
        </Paper>
      ) : (
        <>
          {Object.entries(sessionsBySite).map(([siteId, { site_name, sessions: siteSessions }]) => (
            <Paper key={siteId} sx={{ mb: 3, overflow: "hidden" }}>
              <Box sx={{ px: 3, py: 2, bgcolor: "grey.100" }}>
                <Typography variant="h6">{site_name}</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {siteSessions.map((session) => (
                    <Card
                      key={`${session.schedule_id}-${session.student_id}`}
                      variant="outlined"
                      sx={{
                        borderColor: session.attendance
                          ? getStatusColor(session.attendance.status) === "success"
                            ? "success.main"
                            : getStatusColor(session.attendance.status) === "error"
                              ? "error.main"
                              : "grey.400"
                          : "grey.300",
                        borderWidth: session.attendance ? 2 : 1,
                      }}
                    >
                      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              cursor: "pointer",
                              borderRadius: 1,
                              p: 0.5,
                              m: -0.5,
                              "&:hover": {
                                bgcolor: "action.hover",
                              },
                            }}
                            onClick={() => navigate(`/teachers/students/${session.student_id}`)}
                          >
                            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                              {session.student_initials}
                            </Avatar>

                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {session.student_first_name} {session.student_last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1 }} />

                          {session.attendance ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Chip
                                label={getStatusLabel(session.attendance.status)}
                                color={getStatusColor(session.attendance.status)}
                                size="small"
                              />
                              {session.attendance.reason && (
                                <Typography variant="caption" color="text.secondary">
                                  (
                                  {
                                    ABSENCE_REASONS.find(
                                      (r) => r.value === session.attendance?.reason,
                                    )?.label
                                  }
                                  )
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <ButtonGroup variant="outlined" size="small">
                              <Button
                                color="success"
                                onClick={() => handleMarkAttendance(session, "present")}
                                startIcon={<CheckIcon />}
                                disabled={markAttendanceMutation.isPending}
                              >
                                Present
                              </Button>
                              <Button
                                color="error"
                                onClick={() => handleMarkAttendance(session, "no_show")}
                                startIcon={<CloseIcon />}
                                disabled={markAttendanceMutation.isPending}
                              >
                                No Show
                              </Button>
                              <Button
                                color="inherit"
                                onClick={() => handleMarkAttendance(session, "cancelled")}
                                startIcon={<BlockIcon />}
                                disabled={markAttendanceMutation.isPending}
                              >
                                Cancelled
                              </Button>
                            </ButtonGroup>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Paper>
          ))}

          {/* Sticky footer showing progress */}
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              zIndex: 1000,
            }}
            elevation={3}
          >
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Typography variant="body1">
                <strong>{markedCount}</strong> of <strong>{totalCount}</strong> marked
              </Typography>
              {markedCount === totalCount && totalCount > 0 && (
                <Chip label="All Done!" color="success" size="small" />
              )}
            </Box>
          </Paper>

          {/* Add bottom padding to account for sticky footer */}
          <Box sx={{ height: 80 }} />
        </>
      )}

      {/* Reason Dialog */}
      <Dialog
        open={reasonDialogOpen}
        onClose={() => setReasonDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedStatus === "no_show" ? "Mark as No Show" : "Mark as Cancelled"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Student:{" "}
              <strong>
                {selectedSession?.student_first_name} {selectedSession?.student_last_name}
              </strong>
            </Typography>

            <FormControl fullWidth required>
              <InputLabel>Reason</InputLabel>
              <Select
                value={selectedReason}
                label="Reason"
                onChange={(e) => setSelectedReason(e.target.value as AbsenceReason)}
              >
                {ABSENCE_REASONS.map((reason) => (
                  <MenuItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedReason === "other" && (
              <TextField
                label="Please specify"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAbsence}
            variant="contained"
            color={selectedStatus === "no_show" ? "error" : "inherit"}
            disabled={!selectedReason || (selectedReason === "other" && !reasonText)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Undo Snackbar */}
      <Snackbar
        open={undoSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setUndoSnackbar({ open: false, session: null, previousStatus: null })}
        message={`Marked ${undoSnackbar.session?.student_first_name} ${undoSnackbar.session?.student_last_name}`}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleUndo}
            aria-label="Undo attendance marking"
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}
