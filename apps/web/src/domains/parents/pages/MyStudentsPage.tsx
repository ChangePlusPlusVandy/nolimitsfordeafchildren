import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
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
  Divider,
  Link,
} from "@mui/material";
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationsIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import {
  useParentHttpService,
  type LinkedChild,
} from "../services/ParentHttpService";
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function StaffRoleChip({ role }: { role: "administrator" | "teacher" }) {
  return (
    <Chip
      icon={<WorkIcon />}
      label={role === "administrator" ? "Administrator" : "Teacher"}
      size="small"
      variant="outlined"
    />
  );
}

function ChildCard({ child }: { child: LinkedChild }) {
  const navigate = useNavigate();
  const attendanceColor = getAttendanceColor(
    child.attendance_summary.attendance_rate,
  );

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
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack spacing={2}>
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
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="div">
                  {child.first_name} {child.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {child.site.name}
                </Typography>
              </Box>
            </Stack>

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
                    {formatDate(child.next_session.date)} at{" "}
                    {formatTime(child.next_session.time)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming sessions
                </Typography>
              )}
              {child.next_session && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 3.5 }}
                >
                  with {child.next_session.teacher_name}
                </Typography>
              )}
            </Box>

            <Box>
              <Chip
                icon={
                  attendanceColor === "success" ? (
                    <CheckCircleIcon />
                  ) : (
                    <WarningIcon />
                  )
                }
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
                {child.attendance_summary.present} of{" "}
                {child.attendance_summary.total} sessions
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function StaffMemberCard({
  member,
}: {
  member: {
    id: string;
    name: string;
    role: "administrator" | "teacher";
    headshot: string | null;
    email: string | null;
    phone: string | null;
  };
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={member.headshot || undefined}
            sx={{
              width: 56,
              height: 56,
              bgcolor: "primary.main",
              fontSize: "1rem",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(member.name)}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {member.name}
              </Typography>
              <StaffRoleChip role={member.role} />
            </Stack>

            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {member.email ? (
                <Link
                  href={`mailto:${member.email}`}
                  underline="hover"
                  color="text.secondary"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    width: "fit-content",
                  }}
                >
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">{member.email}</Typography>
                </Link>
              ) : null}

              {member.phone ? (
                <Link
                  href={`tel:${member.phone}`}
                  underline="hover"
                  color="text.secondary"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    width: "fit-content",
                  }}
                >
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">{member.phone}</Typography>
                </Link>
              ) : null}

              {!member.email && !member.phone ? (
                <Typography variant="body2" color="text.secondary">
                  No direct contact listed.
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
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
            maxWidth: {
              xs: "100%",
              sm: "calc(50% - 12px)",
              md: "calc(33.33% - 16px)",
            },
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

function StaffSectionSkeleton() {
  return (
    <Stack spacing={2}>
      {[1, 2].map((i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rounded" height={84} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default function MyStudentsPage() {
  const parentHttpService = useParentHttpService();
  const table = useServerTable({ defaultLimit: 12 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [parentHttpService.key, "myChildren", table.page, table.limit],
    queryFn: () =>
      parentHttpService.queries.myChildren({
        page: table.page,
        limit: table.limit,
      }),
  });

  const children = data?.items ?? [];

  const locations = useMemo(() => {
    const map = new Map<string, LinkedChild["site"]>();
    for (const child of children) {
      map.set(child.site.id, child.site);
    }
    return [...map.values()];
  }, [children]);

  const staffQueries = useQueries({
    queries: locations.map((location) => ({
      queryKey: [parentHttpService.key, "locationStaff", location.id],
      queryFn: () =>
        parentHttpService.queries.locationStaff({ siteId: location.id }),
      enabled: !!location.id,
    })),
  });

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
                  maxWidth: {
                    xs: "100%",
                    sm: "calc(50% - 12px)",
                    md: "calc(33.33% - 16px)",
                  },
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
            onRowsPerPageChange={(event) =>
              table.setLimit(Number(event.target.value))
            }
          />

          <Divider sx={{ my: 4 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Staff at your locations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrators and teachers grouped by the locations your
                children attend.
              </Typography>
            </Box>

            {locations.length === 0 ? null : (
              <Stack spacing={3}>
                {locations.map((location, index) => {
                  const query = staffQueries[index];
                  const staff = query?.data?.staff ?? [];

                  return (
                    <Card
                      key={location.id}
                      variant="outlined"
                      sx={{ borderRadius: 3 }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {location.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {query?.isLoading
                                ? "Loading staff..."
                                : `${staff.length} staff member${staff.length === 1 ? "" : "s"}`}
                            </Typography>
                          </Box>

                          {query?.isLoading ? (
                            <StaffSectionSkeleton />
                          ) : query?.error ? (
                            <ErrorAlert message="Failed to load staff for this location." />
                          ) : staff.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No staff listed for this location.
                            </Typography>
                          ) : (
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {staff.map((member: any) => (
                                <Box
                                  key={member.id}
                                  sx={{
                                    flex: "1 1 320px",
                                    maxWidth: {
                                      xs: "100%",
                                      md: "calc(50% - 8px)",
                                    },
                                  }}
                                >
                                  <StaffMemberCard member={member} />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </>
      )}
    </PageContainer>
  );
}
