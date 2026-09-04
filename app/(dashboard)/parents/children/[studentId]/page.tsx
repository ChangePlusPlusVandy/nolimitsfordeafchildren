"use client";

import {
  Announcement as AnnouncementIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Help as HelpIcon,
  LocationOn as LocationIcon,
  EventBusy as MissedIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Replay as ReplayIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import RequestMakeupModal from "@/client/components/parents/RequestMakeupModal";
import SectionCard from "@/client/components/SectionCard";
import DetailPageSkeleton from "@/client/components/skeletons/DetailPageSkeleton";
import { type ChildScheduleSession, getChildDetails } from "@/client/parents";
import { listPhotos } from "@/client/sessions";
import { formatDate, formatTime } from "@/client/utils/formatDate";

interface ChildPhoto {
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

function formatHearingLossType(value: string | null): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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

export default function ChildDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);

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
    refetch,
  } = useQuery({
    queryKey: ["parents", "childDetails", studentId],
    queryFn: () => getChildDetails(studentId),
    enabled: !!studentId,
  });

  const { data: photosData } = useQuery<{ items: ChildPhoto[] }>({
    queryKey: ["parent-child-photos", studentId],
    queryFn: () => listPhotos({ student_id: studentId, page: 1, limit: 30 }),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <DetailPageSkeleton />
      </PageContainer>
    );
  }

  if (error || !child) {
    return (
      <PageContainer>
        <PageHeader
          title="Child Details"
          back="/my-students"
          breadcrumbs={[{ label: "My Students", href: "/my-students" }, { label: "Details" }]}
        />
        <ErrorAlert
          message="Failed to load child details. Please try again."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const attendanceRate = child.attendance_summary.attendance_rate;

  return (
    <PageContainer>
      <PageHeader
        title={`${child.first_name} ${child.last_name}`}
        back="/my-students"
        breadcrumbs={[
          { label: "My Students", href: "/my-students" },
          { label: `${child.first_name} ${child.last_name}` },
        ]}
      />

      <Stack spacing={3}>
        {/* Header with Avatar and Basic Info */}
        <SectionCard>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            sx={{ alignItems: { xs: "center", sm: "flex-start" } }}
          >
            <Avatar
              src={child.photo_url || undefined}
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
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                useFlexGap
                sx={{ alignItems: { xs: "center", sm: "flex-start" }, flexWrap: "wrap" }}
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
                <Chip
                  label={`Devices: ${child.hearing_devices.length > 0 ? child.hearing_devices.join(", ") : "Not specified"}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Loss Type: ${formatHearingLossType(child.hearing_loss_type)}`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Box>
          </Stack>
        </SectionCard>

        {/* Attendance Summary */}
        <SectionCard title="Attendance Summary">
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
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
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
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
        </SectionCard>

        {/* Pending Requests Banner */}
        {(child.pending_makeup_requests > 0 || child.pending_schedule_change_requests > 0) && (
          <Box>
            <ErrorAlert
              message={`You have ${child.pending_makeup_requests + child.pending_schedule_change_requests} pending request(s) being reviewed.`}
              sx={{ mb: 0 }}
            />
          </Box>
        )}

        {/* Two Column Layout for Sessions */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {/* Upcoming Sessions */}
          <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
            <SectionCard title="Upcoming Sessions" icon={<ScheduleIcon />}>
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
            </SectionCard>
          </Box>

          {/* Recent Sessions */}
          <Box sx={{ flex: "1 1 400px", minWidth: 0 }}>
            <SectionCard title="Recent Sessions" icon={<CalendarIcon />}>
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
            </SectionCard>
          </Box>
        </Box>

        {/* Missed Sessions (can request makeup) */}
        {child.missed_sessions.length > 0 && (
          <SectionCard title="Missed Sessions" icon={<MissedIcon />}>
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
          </SectionCard>
        )}

        {/* Relevant Bulletins */}
        {child.relevant_bulletins.length > 0 && (
          <SectionCard title="Recent Announcements" icon={<AnnouncementIcon />}>
            <Stack spacing={2} divider={<Divider />}>
              {child.relevant_bulletins.map((bulletin) => (
                <Box key={bulletin.id}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
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
                      {formatDate(bulletin.publish_at)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </SectionCard>
        )}

        {/* Siblings */}
        {child.siblings.length > 0 && (
          <SectionCard title="Siblings" icon={<FamilyRestroomIcon />}>
            <Stack spacing={1.5} divider={<Divider />}>
              {child.siblings.map((sibling) => (
                <Box key={sibling.id}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {sibling.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sibling.relationship}
                    {sibling.age !== null ? ` • Age ${sibling.age}` : ""}
                    {` • ${sibling.is_participant ? "Participant" : "Not participant"}`}
                    {` • ${sibling.has_hearing_loss ? "Has hearing loss" : "No hearing loss"}`}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        )}

        {/* Photo Gallery */}
        <SectionCard title="Photo Gallery" icon={<PhotoLibraryIcon />}>
          {(photosData?.items.length || 0) === 0 ? (
            <EmptyState
              icon={<PhotoLibraryIcon sx={{ fontSize: 48 }} />}
              title="No Photos Yet"
              description="No photos have been shared yet."
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              {(photosData?.items || []).map((photo) => (
                <Paper key={photo.id} variant="outlined" sx={{ overflow: "hidden" }}>
                  <Box
                    component="img"
                    src={photo.file_url}
                    alt={photo.caption || photo.file_name}
                    sx={{ width: "100%", height: 180, objectFit: "cover" }}
                  />
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(photo.session_date)} - {photo.location.name}
                    </Typography>
                    {photo.caption && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {photo.caption}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </SectionCard>

        {/* Approved Documents */}
        {child.approved_documents.length > 0 && (
          <SectionCard title="Approved Documents" icon={<DescriptionIcon />}>
            <Stack spacing={1.5} divider={<Divider />}>
              {child.approved_documents.map((doc) => (
                <Box key={doc.id}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {doc.file_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {doc.document_type.replace(/_/g, " ")}
                    {doc.session_date ? ` • Session: ${formatDate(doc.session_date)}` : ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {formatDate(doc.created_at)}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      window.open(doc.file_url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    View
                  </Button>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        )}
      </Stack>

      {/* Request Make-Up Modal */}
      <RequestMakeupModal
        open={makeupModalOpen}
        onClose={() => {
          setMakeupModalOpen(false);
          setSelectedMissedSession(null);
        }}
        studentId={studentId}
        missedSession={selectedMissedSession}
      />
    </PageContainer>
  );
}
