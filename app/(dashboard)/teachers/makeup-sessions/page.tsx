"use client";

import {
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  EventRepeat as MakeupIcon,
  Cancel as NoShowIcon,
  CheckCircle as PresentIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
  Skeleton,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { useServerTable } from "@/client/hooks/useServerTable";
import { listMakeupSessionsForTeacher, markMakeupSessionAttendance } from "@/client/makeups";
import { getMe } from "@/client/me";
import { formatDate, formatTime } from "@/client/utils/formatDate";

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
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDate(session.scheduled_date)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
        <Card key={`skeleton-${i}`} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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

function MakeupSessionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const table = useServerTable({ defaultLimit: 20 });

  // Resolve the teacher's profile id from /me (matches the legacy flow).
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });
  const teacherProfileId = meData?.teacherProfileId ?? "";

  // Fetch makeup sessions
  const {
    data: sessionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "teachers",
      teacherProfileId,
      "makeup-sessions",
      selectedDate || "all",
      table.page,
      table.limit,
    ],
    queryFn: () =>
      listMakeupSessionsForTeacher(teacherProfileId, {
        ...(selectedDate ? { date: selectedDate } : {}),
        page: table.page,
        limit: table.limit,
      }),
    enabled: Boolean(teacherProfileId),
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: "present" | "late" | "no_show";
    }) => markMakeupSessionAttendance(sessionId, { status }),
    onSuccess: () => {
      toast.success("Attendance marked successfully!");
      queryClient.invalidateQueries({
        queryKey: ["teachers", teacherProfileId, "makeup-sessions"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark attendance");
    },
  });

  const sessions: MakeupSession[] = (sessionsData?.items ?? []) as MakeupSession[];

  const handleMarkAttendance = (sessionId: string, status: "present" | "late" | "no_show") => {
    markAttendanceMutation.mutate({ sessionId, status });
  };

  return (
    <PageContainer>
      <PageHeader title="Make-Up Sessions" breadcrumbs={[{ label: "Make-Up Sessions" }]} />

      <Stack spacing={3}>
        {/* Date Filter */}
        <SectionCard>
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
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={() => {
                setSelectedDate("");
                table.setPage(1);
              }}
              disabled={!selectedDate}
            >
              Show All Dates
            </Button>
          </Box>
        </SectionCard>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorAlert message="Failed to load make-up sessions." onRetry={() => refetch()} />
        ) : sessions.length === 0 ? (
          <Alert severity="info" icon={<MakeupIcon />}>
            You don&apos;t have any make-up sessions assigned. Make-up sessions will appear here
            when an administrator schedules them for you.
          </Alert>
        ) : (
          <>
            <SectionCard
              title={
                selectedDate ? `Sessions on ${formatDate(selectedDate)}` : "All Assigned Sessions"
              }
            >
              {sessions.map((session) => (
                <MakeupSessionCard
                  key={session.id}
                  session={session}
                  onMarkAttendance={handleMarkAttendance}
                  isLoading={markAttendanceMutation.isPending}
                />
              ))}
            </SectionCard>

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
            <SectionCard sx={{ bgcolor: "grey.50" }}>
              <Stack direction="row" spacing={3} sx={{ justifyContent: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {sessionsData?.total ?? sessions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="success.main">
                    {sessions.filter((s) => s.attendance_status === "present").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
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
            </SectionCard>
          </>
        )}
      </Stack>
    </PageContainer>
  );
}

export default function MakeupSessionsPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MakeupSessionsPage />
    </Suspense>
  );
}
