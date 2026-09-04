"use client";

import {
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Link,
  Skeleton,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import { useServerTable } from "@/client/hooks/useServerTable";
import {
  getLocationStaff,
  getMyChildren,
  type LinkedChild,
  type LocationStaffMember,
} from "@/client/parents";
import { formatDate, formatTime } from "@/client/utils/formatDate";

function getAttendanceColor(rate: number): "success" | "warning" | "error" {
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "error";
}

function ChildCard({ child }: { child: LinkedChild }) {
  const router = useRouter();
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
        onClick={() => router.push(`/parents/children/${child.id}`)}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack spacing={2}>
            {/* Avatar and Name */}
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
          key={`skeleton-${i}`}
          sx={{
            flex: "1 1 300px",
            maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.33% - 16px)" },
          }}
        >
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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

function StaffMemberCard({ member }: { member: LocationStaffMember }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              src={member.photo_url || undefined}
              sx={{
                width: 48,
                height: 48,
                bgcolor: member.role === "administrator" ? "secondary.main" : "primary.main",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {member.name}
              </Typography>
              <Chip
                label={member.role === "administrator" ? "Admin" : "Teacher"}
                size="small"
                color={member.role === "administrator" ? "secondary" : "primary"}
                variant="outlined"
                sx={{ mt: 0.25 }}
              />
            </Box>
          </Stack>
          {member.bio && (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {member.bio}
            </Typography>
          )}
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <EmailIcon fontSize="small" color="action" />
              <Link href={`mailto:${member.email}`} variant="body2" noWrap>
                {member.email}
              </Link>
            </Stack>
            {member.phone && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <PhoneIcon fontSize="small" color="action" />
                <Link href={`tel:${member.phone}`} variant="body2">
                  {member.phone}
                </Link>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StaffSectionSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Box
            key={`skeleton-${i}`}
            sx={{
              flex: "1 1 280px",
              maxWidth: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.33% - 11px)" },
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="rounded" width={60} height={20} />
                    </Box>
                  </Stack>
                  <Skeleton variant="text" width="80%" />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MyStudentsPage() {
  const table = useServerTable({ defaultLimit: 12 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["parents", "myChildren", table.page, table.limit],
    queryFn: () => getMyChildren({ page: table.page, limit: table.limit }),
  });

  const children = data?.items ?? [];

  // Derive unique location IDs from children
  const uniqueLocations = useMemo(() => {
    const seen = new Map<string, string>();
    for (const child of children) {
      if (!seen.has(child.site.id)) {
        seen.set(child.site.id, child.site.name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [children]);

  // Fire parallel staff queries for each unique location
  const staffQueries = useQueries({
    queries: uniqueLocations.map((loc) => ({
      queryKey: ["parents", "locationStaff", loc.id],
      queryFn: () => getLocationStaff(loc.id),
      enabled: children.length > 0,
    })),
  });

  const staffLoading = staffQueries.some((q) => q.isLoading);

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

          {/* Staff at Your Locations */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" gutterBottom>
            Staff at Your Locations
          </Typography>

          {staffLoading ? (
            <StaffSectionSkeleton />
          ) : (
            <Stack spacing={3}>
              {staffQueries.map((query, idx) => {
                const loc = uniqueLocations[idx];
                if (!loc) return null;
                if (query.error || !query.data) return null;
                const { staff } = query.data;
                if (staff.length === 0) return null;

                return (
                  <Box key={loc.id}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1.5 }}>
                      {loc.name}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {staff.map((member) => (
                        <Box
                          key={member.id}
                          sx={{
                            flex: "1 1 280px",
                            maxWidth: {
                              xs: "100%",
                              sm: "calc(50% - 8px)",
                              md: "calc(33.33% - 11px)",
                            },
                          }}
                        >
                          <StaffMemberCard member={member} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </>
      )}
    </PageContainer>
  );
}

export default function MyStudentsPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MyStudentsPage />
    </Suspense>
  );
}
