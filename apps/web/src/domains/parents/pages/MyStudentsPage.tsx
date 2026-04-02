import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  Skeleton,
  Stack,
  Badge,
  TablePagination,
  Typography,
} from "@mui/material";
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationsIcon,
} from "@mui/icons-material";
import { useParentHttpService, type LinkedChild } from "../services/ParentHttpService";
import { useServerTable } from "../../global/hooks/useServerTable";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import { formatDate, formatTime } from "../../../utils/formatDate";

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
  const table = useServerTable({ defaultLimit: 12 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [parentHttpService.key, "myChildren", table.page, table.limit],
    queryFn: () => parentHttpService.queries.myChildren({ page: table.page, limit: table.limit }),
  });

  const children = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader title="My Students" />

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert
          message="Failed to load your children. Please try again."
          onRetry={() => refetch()}
        />
      ) : children.length === 0 ? (
        <EmptyState
          icon={<PersonIcon sx={{ fontSize: 48 }} />}
          title="No Children Linked"
          description="No children are linked to your account yet. Please contact an administrator if you believe this is an error."
        />
      ) : (
        <>
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
          <TablePagination
            rowsPerPageOptions={[6, 12, 24]}
            component="div"
            count={data?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />
        </>
      )}
    </PageContainer>
  );
}
