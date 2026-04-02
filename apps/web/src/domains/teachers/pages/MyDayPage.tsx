import { useState, type ChangeEvent } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Block as BlockIcon,
  Undo as UndoIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";
import {
  useTeacherHttpService,
  type SessionForDay,
  type MyDayResponse,
  type AttendanceStatus,
  type AbsenceReason,
} from "../services/TeacherHttpService";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";

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

function getStatusColor(
  status: AttendanceStatus | undefined,
): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "present":
      return "success";
    case "late":
      return "warning";
    case "no_show":
      return "error";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

function getStatusBorderColor(
  status: AttendanceStatus | undefined,
): "success.main" | "warning.main" | "error.main" | "grey.400" {
  switch (status) {
    case "present":
      return "success.main";
    case "late":
      return "warning.main";
    case "no_show":
      return "error.main";
    case "cancelled":
    default:
      return "grey.400";
  }
}

function getStatusLabel(status: AttendanceStatus | undefined): string {
  switch (status) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "no_show":
      return "No Show";
    case "cancelled":
      return "Cancelled";
    default:
      return "Not Marked";
  }
}

interface SessionPhoto {
  id: string;
  session_date: string;
  caption: string | null;
  file_url: string;
  file_name: string;
  location: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    initials: string;
  } | null;
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

export default function MyDayPage() {
  const navigate = useNavigate();
  const teacherHttpService = useTeacherHttpService();
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [lateDialogOpen, setLateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionForDay | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [selectedLateMinutes, setSelectedLateMinutes] = useState<number>(10);
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | "">("");
  const [reasonText, setReasonText] = useState("");
  const [view, setView] = useState<"day" | "week">("day");
  const [undoSnackbar, setUndoSnackbar] = useState<{
    open: boolean;
    session: SessionForDay | null;
    previousStatus: AttendanceStatus | null;
    previousLateMinutes: number | null;
  }>({ open: false, session: null, previousStatus: null, previousLateMinutes: null });
  const [photoLocationId, setPhotoLocationId] = useState("");
  const [photoStudentId, setPhotoStudentId] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function getWeekDates(date: Date): string[] {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0]!;
    });
  }

  function getWeekRange(date: Date) {
    const d = new Date(date);
    const day = d.getDay();

    const start = new Date(d);
    start.setDate(d.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return {
      startOfWeek: start.toLocaleDateString("en-US", options),
      endOfWeek: end.toLocaleDateString("en-US", options),
    };
  }

  const weekDates = getWeekDates(new Date(selectedDate));
  const { startOfWeek, endOfWeek } = getWeekRange(new Date(selectedDate));

  const { data, isLoading, error } = useQuery<MyDayResponse>({
    queryKey: [teacherHttpService.key, "myDay", view, selectedDate],
    queryFn: async () => {
      if (view === "day") {
        return teacherHttpService.queries.myDay({ date: selectedDate });
      }

      const results = await Promise.all(
        weekDates.map((date) => teacherHttpService.queries.myDay({ date })),
      );

      return {
        sessions: results.flatMap((r) => r.sessions),
      };
    },
  });

  const { data: photosData } = useQuery<{ items: SessionPhoto[] }>({
    queryKey: ["teacher-session-photos", selectedDate],
    queryFn: async () => {
      const response = await httpClient.get("/v1/photos", {
        params: { session_date: selectedDate, page: 1, limit: 20 },
      });
      return response.data;
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      student_id,
      schedule_id,
      session_date,
      status,
      late_minutes,
      reason,
      reason_text,
    }: {
      student_id: string;
      schedule_id: string;
      session_date: string;
      status: AttendanceStatus;
      late_minutes?: number;
      reason?: AbsenceReason;
      reason_text?: string;
    }) => {
      const response = await httpClient.post("/v1/attendance", {
        student_id,
        schedule_id,
        session_date,
        status,
        late_minutes,
        reason,
        reason_text,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "myDay"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!photoFile || !photoLocationId) {
        throw new Error("Please select a location and image file");
      }

      const uploadResponse = await httpClient.post("/v1/photos/upload-url", {
        location_id: photoLocationId,
        student_id: photoStudentId || undefined,
        session_date: selectedDate,
        file_name: photoFile.name,
        content_type: photoFile.type || "image/jpeg",
      });

      const uploadResult = await fetch(uploadResponse.data.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": photoFile.type || "image/jpeg",
        },
        body: photoFile,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload photo file");
      }

      await httpClient.post("/v1/photos", {
        location_id: photoLocationId,
        student_id: photoStudentId || undefined,
        session_date: selectedDate,
        caption: photoCaption || undefined,
        file_url: uploadResponse.data.file_url,
        file_name: photoFile.name,
        file_size: photoFile.size,
        mime_type: photoFile.type || "image/jpeg",
      });
    },
    onSuccess: () => {
      setPhotoStudentId("");
      setPhotoCaption("");
      setPhotoFile(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-session-photos"] });
      showToast({ message: "Photo uploaded", severity: "success" });
    },
    onError: (error: any) => {
      showToast({
        message: error.message || "Failed to upload photo",
        severity: "error",
      });
    },
  });

  const handleMarkAttendance = (session: SessionForDay, status: AttendanceStatus) => {
    // Store previous state for undo
    const previousStatus = session.attendance?.status || null;
    const previousLateMinutes = session.attendance?.late_minutes || null;

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
        previousLateMinutes,
      });
    } else if (status === "late") {
      setSelectedSession(session);
      setSelectedStatus(status);
      setSelectedLateMinutes(10);
      setLateDialogOpen(true);
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
    const previousLateMinutes = selectedSession.attendance?.late_minutes || null;

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
      previousLateMinutes,
    });
  };

  const handleConfirmLate = () => {
    if (!selectedSession || selectedStatus !== "late") return;

    const previousStatus = selectedSession.attendance?.status || null;
    const previousLateMinutes = selectedSession.attendance?.late_minutes || null;

    markAttendanceMutation.mutate({
      student_id: selectedSession.student_id,
      schedule_id: selectedSession.schedule_id,
      session_date: selectedDate,
      status: "late",
      late_minutes: selectedLateMinutes,
    });

    setLateDialogOpen(false);
    setUndoSnackbar({
      open: true,
      session: selectedSession,
      previousStatus,
      previousLateMinutes,
    });
  };

  const handleUndo = () => {
    if (!undoSnackbar.session) return;

    const { session, previousStatus, previousLateMinutes } = undoSnackbar;

    if (previousStatus) {
      // Restore previous status
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: selectedDate,
        status: previousStatus,
        late_minutes: previousStatus === "late" ? previousLateMinutes || 10 : undefined,
      });
    }
    // Note: If there was no previous attendance, we can't truly "undo" - just close the snackbar
    // In a production app, you might want a DELETE endpoint for this case

    setUndoSnackbar({ open: false, session: null, previousStatus: null, previousLateMinutes: null });
  };

  const handleReasonChange = (event: SelectChangeEvent<string>) => {
    const value = (event.target as { value: string }).value;
    setSelectedReason(value as AbsenceReason);
  };

  const handleReasonTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = (event.target as any).value as string;
    setReasonText(value);
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" component="h1">
            {view === "day" ? "My Day" : "My Week"}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={200} />
          </Box>
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
  const photoItems = photosData?.items || [];
  const siteOptions = Object.entries(sessionsBySite).map(([siteId, value]) => ({
    id: siteId,
    name: value.site_name,
  }));
  const studentOptions = sessions
    .filter((session) => !photoLocationId || session.site_id === photoLocationId)
    .map((session) => ({
      id: session.student_id,
      label: `${session.student_first_name} ${session.student_last_name} (${session.student_initials})`,
    }))
    .filter((student, index, arr) => arr.findIndex((item) => item.id === student.id) === index);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {view === "day" ? "My Day" : "My Week"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="subtitle1" color="text.secondary">
            {view === "day"
              ? new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : `${startOfWeek} - ${endOfWeek}`}
          </Typography>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => {
              if (newView !== null) {
                setView(newView);
              }
            }}
            sx={{
              height: 32,
              borderRadius: "999px",
              bgcolor: "grey.100",
              p: 0.5,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "999px",
                px: 2,
                py: 0.5,
                textTransform: "none",
                fontSize: "0.85rem",
                color: "text.secondary",
              },
              "& .MuiToggleButton-root.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
                fontWeight: 500,
              },
              "& .MuiToggleButton-root.Mui-selected:hover": {
                backgroundColor: "primary.light",
              },
            }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <PhotoCameraIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          Session Photos
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select
              value={photoLocationId}
              label="Location"
              onChange={(event) => {
                setPhotoLocationId((event.target as unknown as { value: string }).value);
                setPhotoStudentId("");
              }}
            >
              {siteOptions.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Student (optional)</InputLabel>
            <Select
              value={photoStudentId}
              label="Student (optional)"
              onChange={(event) =>
                setPhotoStudentId((event.target as unknown as { value: string }).value)
              }
            >
              <MenuItem value="">All students at location</MenuItem>
              {studentOptions.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Caption (optional)"
            value={photoCaption}
            onChange={(event) =>
              setPhotoCaption((event.target as unknown as { value: string }).value)
            }
            placeholder="Group speech practice at library"
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Button component="label" variant="outlined">
              Choose Photo
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {photoFile?.name || "No file selected"}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => uploadPhotoMutation.mutate()}
            disabled={!photoLocationId || !photoFile || uploadPhotoMutation.isPending}
          >
            {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
          </Button>
        </Stack>

        {photoItems.length > 0 ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            {photoItems.map((photo) => (
              <Card key={photo.id} variant="outlined">
                <Box
                  component="img"
                  src={photo.file_url}
                  alt={photo.caption || photo.file_name}
                  sx={{ width: "100%", height: 160, objectFit: "cover" }}
                />
                <CardContent>
                  <Typography variant="body2" fontWeight={500}>
                    {photo.location.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {photo.student ? `Student ${photo.student.initials}` : "Group photo"}
                  </Typography>
                  {photo.caption && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {photo.caption}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No photos uploaded for this date yet.</Typography>
        )}
      </Paper>

      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {view === "day" ? "No sessions scheduled for today." : "No sessions scheduled for this week."}
          </Typography>
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
                          ? getStatusBorderColor(session.attendance.status)
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
                              {session.attendance.late_minutes && (
                                <Typography variant="caption" color="text.secondary">
                                  ({session.attendance.late_minutes} min late)
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
                                color="warning"
                                onClick={() => handleMarkAttendance(session, "late")}
                                disabled={markAttendanceMutation.isPending}
                              >
                                Late
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
                onChange={handleReasonChange}
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
                onChange={handleReasonTextChange}
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

      <Dialog open={lateDialogOpen} onClose={() => setLateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark as Late</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Student: {selectedSession?.student_first_name} {selectedSession?.student_last_name}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Late By</InputLabel>
              <Select
                value={String(selectedLateMinutes)}
                label="Late By"
                onChange={(event) =>
                  setSelectedLateMinutes(Number((event.target as unknown as { value: string }).value))
                }
              >
                <MenuItem value="10">10 minutes</MenuItem>
                <MenuItem value="15">15 minutes</MenuItem>
                <MenuItem value="30">30 minutes</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleConfirmLate}>
            Confirm Late
          </Button>
        </DialogActions>
      </Dialog>

      {/* Undo Snackbar */}
      <Snackbar
        open={undoSnackbar.open}
        autoHideDuration={5000}
        onClose={() =>
          setUndoSnackbar({
            open: false,
            session: null,
            previousStatus: null,
            previousLateMinutes: null,
          })
        }
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
