import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Skeleton,
  Stack,
  Chip,
  Button,
  Avatar,
  ButtonGroup,
  FormControl,
  InputLabel,
  OutlinedInput,
  TablePagination,
} from "@mui/material";
import {
  EventRepeat as MakeupIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  CheckCircle as PresentIcon,
  Cancel as NoShowIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";
import { useServerTable } from "../../global/hooks/useServerTable";

interface MakeupSession {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
  };
  site: {
    id: string;
    name: string;
  };
  scheduled_date: string;
  scheduled_time: string;
  attendance_status: "pending" | "present" | "late" | "no_show" | null;
  notes: string | null;
  makeup_request?: {
    id: string;
    original_session_date: string;
    reason: string;
  } | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatReason(reason: string): string {
  return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getAttendanceColor(status: string | null): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "present":
      return "success";
    case "late":
      return "warning";
    case "no_show":
      return "error";
    default:
      return "default";
  }
}

function MakeupSessionCard({
  session,
  onMarkAttendance,
  isLoading,
}: {
  session: MakeupSession;
  onMarkAttendance: (sessionId: string, status: "present" | "late" | "no_show") => void;
  isLoading: boolean;
}) {
  const attendanceMarked = session.attendance_status && session.attendance_status !== "pending";

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 48,
                  height: 48,
                  fontSize: "1rem",
                }}
              >
                {session.student.initials}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {session.student.first_name} {session.student.last_name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {session.site.name}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            {attendanceMarked && (
              <Chip
                icon={session.attendance_status === "no_show" ? <NoShowIcon /> : <PresentIcon />}
                label={
                  session.attendance_status === "present"
                    ? "Present"
                    : session.attendance_status === "late"
                      ? "Late"
                      : "No Show"
                }
                color={getAttendanceColor(session.attendance_status)}
                size="small"
              />
            )}
          </Stack>

          {/* Schedule Info */}
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDate(session.scheduled_date)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatTime(session.scheduled_time)}</Typography>
            </Stack>
          </Stack>

          {/* Original Session Info */}
          {session.makeup_request && (
            <Alert severity="info" icon={<MakeupIcon />} sx={{ py: 0.5 }}>
              <Typography variant="body2">
                Make-up for missed session on{" "}
                {formatDate(session.makeup_request.original_session_date)}
                {session.makeup_request.reason &&
                  ` (${formatReason(session.makeup_request.reason)})`}
              </Typography>
            </Alert>
          )}

          {/* Notes */}
          {session.notes && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body2">{session.notes}</Typography>
            </Box>
          )}

          {/* Attendance Buttons */}
          {!attendanceMarked && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Mark Attendance
              </Typography>
              <ButtonGroup variant="outlined" fullWidth>
                <Button
                  startIcon={<PresentIcon />}
                  color="success"
                  onClick={() => onMarkAttendance(session.id, "present")}
                  disabled={isLoading}
                >
                  Present
                </Button>
                <Button
                  color="warning"
                  onClick={() => onMarkAttendance(session.id, "late")}
                  disabled={isLoading}
                >
                  Late
                </Button>
                <Button
                  startIcon={<NoShowIcon />}
                  color="error"
                  onClick={() => onMarkAttendance(session.id, "no_show")}
                  disabled={isLoading}
                >
                  No Show
                </Button>
              </ButtonGroup>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Stack spacing={2}>
      {[1, 2, 3].map((i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              </Stack>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rounded" height={40} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default function MakeupSessionsPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]!);
  const table = useServerTable({ defaultLimit: 20 });

  // Get teacher profile ID - in a real app, this would come from user context or a separate query
  // For now, we'll fetch it from /me endpoint
  const teacherId = "";

  // Fetch makeup sessions
  const {
    data: sessionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teachers", teacherId, "makeup-sessions", selectedDate, table.page, table.limit],
    queryFn: async () => {
      if (!teacherId) {
        // If no teacher profile ID, fetch from /me endpoint
        const meResponse = await httpClient.get("/v1/me");
        const profileId = meResponse.data.teacherProfileId;
        if (!profileId) throw new Error("No teacher profile found");

        const response = await httpClient.get(`/v1/teachers/${profileId}/makeup-sessions`, {
          params: { date: selectedDate, page: table.page, limit: table.limit },
        });
        return response.data;
      }

      const response = await httpClient.get(`/v1/teachers/${teacherId}/makeup-sessions`, {
        params: { date: selectedDate, page: table.page, limit: table.limit },
      });
      return response.data;
    },
    enabled: true,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: "present" | "late" | "no_show";
    }) => {
      const response = await httpClient.patch(`/v1/makeup-sessions/${sessionId}/attendance`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      showToast({ message: "Attendance marked successfully!", severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["teachers", teacherId, "makeup-sessions"] });
    },
    onError: (error: any) => {
      showToast({
        message: error.response?.data?.message || "Failed to mark attendance",
        severity: "error",
      });
    },
  });

  const sessions: MakeupSession[] = sessionsData?.items ?? [];

  const handleMarkAttendance = (sessionId: string, status: "present" | "late" | "no_show") => {
    markAttendanceMutation.mutate({ sessionId, status });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <MakeupIcon sx={{ fontSize: 32 }} color="action" />
        <Typography variant="h4">Make-Up Sessions</Typography>
      </Stack>

      {/* Date Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Filter by Date</InputLabel>
            <OutlinedInput
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                table.setPage(1);
              }}
              label="Filter by Date"
            />
          </FormControl>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Alert severity="error">Failed to load make-up sessions. Please try again.</Alert>
      ) : sessions.length === 0 ? (
        <Alert severity="info" icon={<MakeupIcon />}>
          You don't have any make-up sessions assigned. Make-up sessions will appear here when an
          administrator schedules them for you.
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Sessions on {formatDate(selectedDate)}
            </Typography>
            {sessions.map((session) => (
              <MakeupSessionCard
                key={session.id}
                session={session}
                onMarkAttendance={handleMarkAttendance}
                isLoading={markAttendanceMutation.isPending}
              />
            ))}
          </Box>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={sessionsData?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />

          {/* Summary */}
          <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
            <CardContent>
              <Stack direction="row" spacing={3} justifyContent="center">
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {sessionsData?.total ?? sessions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {sessions.filter((s) => s.attendance_status === "present").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {
                      sessions.filter(
                        (s) => !s.attendance_status || s.attendance_status === "pending",
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
