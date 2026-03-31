import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Skeleton,
  Alert,
  Stack,
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Announcement as AnnouncementIcon,
  EventBusy as MissedIcon,
  Replay as ReplayIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { useParentHttpService, type ChildScheduleSession } from "../services/ParentHttpService";
import RequestMakeupModal from "../components/RequestMakeupModal";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
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

function getStatusIcon(status: ChildScheduleSession["attendance_status"]) {
  switch (status) {
    case "present":
      return <CheckCircleIcon color="success" fontSize="small" />;
    case "no_show":
      return <CancelIcon color="error" fontSize="small" />;
    case "cancelled":
      return <CancelIcon color="disabled" fontSize="small" />;
    default:
      return <HelpIcon color="disabled" fontSize="small" />;
  }
}

function getStatusLabel(status: ChildScheduleSession["attendance_status"]) {
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

function SessionItem({
  session,
  showStatus = true,
}: {
  session: ChildScheduleSession;
  showStatus?: boolean;
}) {
  return (
    <ListItem
      sx={{
        borderRadius: 1,
        bgcolor: session.attendance_status === "no_show" ? "error.50" : "transparent",
      }}
    >
      <ListItemIcon>
        <ScheduleIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1">
              {formatDate(session.date)} at {formatTime(session.start_time)}
            </Typography>
            {showStatus && session.attendance_status && (
              <Chip
                icon={getStatusIcon(session.attendance_status)}
                label={getStatusLabel(session.attendance_status)}
                size="small"
                variant="outlined"
                color={
                  session.attendance_status === "present"
                    ? "success"
                    : session.attendance_status === "no_show"
                      ? "error"
                      : "default"
                }
              />
            )}
          </Stack>
        }
        secondary={
          <Typography variant="body2" color="text.secondary">
            {session.day_of_week} - {session.site.name} with {session.teacher.name}
          </Typography>
        }
      />
    </ListItem>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={200} />
      </Stack>
      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
        </Box>
      </Stack>
      <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={150} />
    </Box>
  );
}

export default function ChildDetailsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const parentHttpService = useParentHttpService();

  // Modal state
  const [makeupModalOpen, setMakeupModalOpen] = useState(false);
  const [selectedMissedSession, setSelectedMissedSession] = useState<{
    schedule_id: string;
    date: string;
    reason: string | null;
  } | null>(null);

  const {
    data: child,
    isLoading,
    error,
  } = useQuery({
    queryKey: [parentHttpService.key, "childDetails", studentId],
    queryFn: () => parentHttpService.queries.childDetails(studentId!),
    enabled: !!studentId,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !child) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/my-students")}
          sx={{ mb: 2 }}
        >
          Back to My Students
        </Button>
        <Alert severity="error">Failed to load child details. Please try again later.</Alert>
      </Box>
    );
  }

  const attendanceRate = child.attendance_summary.attendance_rate;

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/my-students")}
        sx={{ mb: 3 }}
      >
        Back to My Students
      </Button>

      {/* Header with Avatar and Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems={{ xs: "center", sm: "flex-start" }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "primary.main",
              fontSize: "2rem",
              fontWeight: 600,
            }}
          >
            {child.initials}
          </Avatar>
          <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
            <Typography variant="h4" gutterBottom>
              {child.first_name} {child.last_name}
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "center", sm: "flex-start" }}
              flexWrap="wrap"
            >
              <Chip
                icon={<LocationIcon />}
                label={child.site.name}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<CalendarIcon />}
                label={`Age ${calculateAge(child.dob)}`}
                variant="outlined"
                size="small"
              />
              {child.current_school && (
                <Chip
                  icon={<SchoolIcon />}
                  label={child.current_school}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Attendance Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Summary
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2">{attendanceRate.toFixed(0)}% Attendance Rate</Typography>
            <Typography variant="body2" color="text.secondary">
              {child.attendance_summary.present} of {child.attendance_summary.total} sessions
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={attendanceRate}
            color={attendanceRate >= 90 ? "success" : attendanceRate >= 75 ? "warning" : "error"}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip
            icon={<CheckCircleIcon />}
            label={`${child.attendance_summary.present} Present`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<CancelIcon />}
            label={`${child.attendance_summary.no_show} No-Shows`}
            color="error"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<CancelIcon />}
            label={`${child.attendance_summary.cancelled} Cancelled`}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Paper>

      {/* Pending Requests Banner */}
      {(child.pending_makeup_requests > 0 || child.pending_schedule_change_requests > 0) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {child.pending_makeup_requests + child.pending_schedule_change_requests} pending
          request(s) being reviewed.
        </Alert>
      )}

      {/* Two Column Layout for Sessions */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
        {/* Upcoming Sessions */}
        <Paper sx={{ p: 3, flex: "1 1 400px", minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            <ScheduleIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Upcoming Sessions
          </Typography>
          {child.upcoming_sessions.length === 0 ? (
            <Typography color="text.secondary">No upcoming sessions scheduled.</Typography>
          ) : (
            <List disablePadding>
              {child.upcoming_sessions.slice(0, 5).map((session, idx) => (
                <SessionItem
                  key={`${session.schedule_id}-${session.date}-${idx}`}
                  session={session}
                  showStatus={false}
                />
              ))}
            </List>
          )}
        </Paper>

        {/* Recent Sessions */}
        <Paper sx={{ p: 3, flex: "1 1 400px", minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            <CalendarIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Recent Sessions
          </Typography>
          {child.recent_sessions.length === 0 ? (
            <Typography color="text.secondary">No recent sessions.</Typography>
          ) : (
            <List disablePadding>
              {child.recent_sessions.slice(0, 5).map((session, idx) => (
                <SessionItem
                  key={`${session.schedule_id}-${session.date}-${idx}`}
                  session={session}
                />
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* Missed Sessions (can request makeup) */}
      {child.missed_sessions.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <MissedIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Missed Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You may request a make-up class for these missed sessions.
          </Typography>
          <List disablePadding>
            {child.missed_sessions.map((missed) => (
              <ListItem
                key={`${missed.schedule_id}-${missed.date}`}
                secondaryAction={
                  missed.can_request_makeup ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ReplayIcon />}
                      onClick={() => {
                        setSelectedMissedSession({
                          schedule_id: missed.schedule_id,
                          date: missed.date,
                          reason: missed.reason,
                        });
                        setMakeupModalOpen(true);
                      }}
                    >
                      Request Make-Up
                    </Button>
                  ) : (
                    <Chip label="Request Pending" size="small" color="warning" />
                  )
                }
              >
                <ListItemIcon>
                  <CancelIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={formatDate(missed.date)}
                  secondary={
                    missed.reason
                      ? `Reason: ${missed.reason.replace(/_/g, " ")}`
                      : "No reason provided"
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Relevant Bulletins */}
      {child.relevant_bulletins.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <AnnouncementIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Recent Announcements
          </Typography>
          <Stack spacing={2} divider={<Divider />}>
            {child.relevant_bulletins.map((bulletin) => (
              <Box key={bulletin.id}>
                <Typography variant="subtitle1" fontWeight={500}>
                  {bulletin.title}
                </Typography>
                {bulletin.body && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {bulletin.body.length > 150
                      ? `${bulletin.body.slice(0, 150)}...`
                      : bulletin.body}
                  </Typography>
                )}
                {bulletin.publish_at && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(bulletin.publish_at).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Approved Documents */}
      {child.approved_documents.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            <DescriptionIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Approved Documents
          </Typography>
          <Stack spacing={1.5} divider={<Divider />}>
            {child.approved_documents.map((doc) => (
              <Box key={doc.id}>
                <Typography variant="subtitle1" fontWeight={500}>
                  {doc.file_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {doc.document_type.replace(/_/g, " ")}
                  {doc.session_date ? ` • Session: ${new Date(doc.session_date).toLocaleDateString()}` : ""}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {new Date(doc.created_at).toLocaleDateString()}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    (globalThis as unknown as {
                      open?: (url?: string, target?: string, features?: string) => void;
                    }).open?.(doc.file_url, "_blank", "noopener,noreferrer");
                  }}
                >
                  View
                </Button>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Request Make-Up Modal */}
      <RequestMakeupModal
        open={makeupModalOpen}
        onClose={() => {
          setMakeupModalOpen(false);
          setSelectedMissedSession(null);
        }}
        studentId={studentId!}
        missedSession={selectedMissedSession}
      />
    </Box>
  );
}
