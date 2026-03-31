import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  Skeleton,
  Alert,
  Stack,
  Badge,
} from "@mui/material";
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationsIcon,
} from "@mui/icons-material";
import { useParentHttpService, type LinkedChild } from "../services/ParentHttpService";

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

function getAttendanceColor(rate: number): "success" | "warning" | "error" {
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "error";
}

function ChildCard({ child }: { child: LinkedChild }) {
  const navigate = useNavigate();
  const attendanceColor = getAttendanceColor(child.attendance_summary.attendance_rate);

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      {child.pending_requests > 0 && (
        <Badge
          badgeContent={child.pending_requests}
          color="warning"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
          }}
        >
          <NotificationsIcon color="action" />
        </Badge>
      )}
      <CardActionArea
        onClick={() => navigate(`/parents/children/${child.id}`)}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack spacing={2}>
            {/* Avatar and Name */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={child.photo_url || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "primary.main",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}
              >
                {child.initials}
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {child.first_name} {child.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {child.site.name}
                </Typography>
              </Box>
            </Stack>

            {/* Next Session */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Next Session
              </Typography>
              {child.next_session ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(child.next_session.date)} at {formatTime(child.next_session.time)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming sessions
                </Typography>
              )}
              {child.next_session && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                  with {child.next_session.teacher_name}
                </Typography>
              )}
            </Box>

            {/* Attendance Chip */}
            <Box>
              <Chip
                icon={attendanceColor === "success" ? <CheckCircleIcon /> : <WarningIcon />}
                label={`${child.attendance_summary.attendance_rate.toFixed(0)}% Attendance`}
                color={attendanceColor}
                size="small"
                variant="outlined"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {child.attendance_summary.present} of {child.attendance_summary.total} sessions
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            flex: "1 1 300px",
            maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.33% - 16px)" },
          }}
        >
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={56} height={56} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Stack>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="rounded" width={120} height={24} />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

export default function MyStudentsPage() {
  const parentHttpService = useParentHttpService();

  const { data, isLoading, error } = useQuery({
    queryKey: [parentHttpService.key, "myChildren"],
    queryFn: parentHttpService.queries.myChildren,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Children
        </Typography>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Children
        </Typography>
        <Alert severity="error">Failed to load your children. Please try again later.</Alert>
      </Box>
    );
  }

  const children = data?.items ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Children
      </Typography>

      {children.length === 0 ? (
        <Alert severity="info" icon={<PersonIcon />}>
          No children are linked to your account yet. Please contact an administrator if you believe
          this is an error.
        </Alert>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {children.map((child) => (
            <Box
              key={child.id}
              sx={{
                flex: "1 1 300px",
                maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.33% - 16px)" },
              }}
            >
              <ChildCard child={child} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
