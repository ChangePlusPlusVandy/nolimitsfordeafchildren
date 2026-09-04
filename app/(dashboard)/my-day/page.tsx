"use client";

import {
  Block as BlockIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Undo as UndoIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { markAttendance } from "@/client/attendance";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { getMe } from "@/client/me";
import { createPhoto, getPhotoUploadUrl, listSessionPhotos } from "@/client/sessions";
import { getStudentDetails } from "@/client/students";
import {
  type AbsenceReason,
  type AttendanceStatus,
  getMyDay,
  getTeacherDetails,
  type MyDayResponse,
  postTeacherSickDayNotice,
  type SessionForDay,
} from "@/client/teachers";
import { formatTime } from "@/client/utils/formatDate";

const ABSENCE_REASONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "transportation", label: "Transportation Issue" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "no_show_unknown", label: "No Show (Unknown)" },
  { value: "other", label: "Other" },
];

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedDate] = useState(() => new Date().toISOString().split("T")[0]);
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
    previousSiblingIds: string[];
  }>({
    open: false,
    session: null,
    previousStatus: null,
    previousLateMinutes: null,
    previousSiblingIds: [],
  });
  const [photoLocationId, setPhotoLocationId] = useState("");
  const [photoStudentId, setPhotoStudentId] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sickDayDialogOpen, setSickDayDialogOpen] = useState(false);
  const [sickDayNote, setSickDayNote] = useState("");
  const [sickDaySiteId, setSickDaySiteId] = useState("");
  const [siblingDialogOpen, setSiblingDialogOpen] = useState(false);
  const [siblingSession, setSiblingSession] = useState<SessionForDay | null>(null);
  const [siblingOptions, setSiblingOptions] = useState<
    Array<{ id: string; name: string; relationship: string }>
  >([]);
  const [siblingDialogSelection, setSiblingDialogSelection] = useState<string[]>([]);
  const [pendingSiblingSelections, setPendingSiblingSelections] = useState<
    Record<string, string[]>
  >({});

  function getSessionKey(
    session: Pick<SessionForDay, "session_date" | "schedule_id" | "student_id">,
  ): string {
    return `${session.session_date}::${session.schedule_id}::${session.student_id}`;
  }

  function getSiblingIdsForSession(session: SessionForDay): string[] {
    const sessionKey = getSessionKey(session);
    if (pendingSiblingSelections[sessionKey] !== undefined) {
      return pendingSiblingSelections[sessionKey] ?? [];
    }

    return session.attendance?.sibling_participants?.map((sp) => sp.sibling_id) ?? [];
  }

  function getWeekDates(date: Date): string[] {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
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
  const weekStartDate = weekDates[0] ?? selectedDate;
  const weekEndDate = weekDates[6] ?? selectedDate;

  const { data, isLoading, error, refetch } = useQuery<MyDayResponse>({
    queryKey: ["teachers", "myDay", view, selectedDate],
    queryFn: () => {
      if (view === "day") {
        return getMyDay({ date: selectedDate });
      }

      return getMyDay({
        start_date: weekStartDate,
        end_date: weekEndDate,
      });
    },
  });

  const { data: photosData } = useQuery<{ items: SessionPhoto[] }>({
    queryKey: ["teacher-session-photos", selectedDate],
    queryFn: () => listSessionPhotos(selectedDate, { page: 1, limit: 20 }),
    enabled: view === "day",
  });

  const { data: meData } = useQuery<{ teacherProfileId?: string | null }>({
    queryKey: ["me", "my-day"],
    queryFn: () => getMe(),
  });

  const { data: teacherProfileData } = useQuery<{
    primary_site_id?: string | null;
    primarySite?: { id: string; name: string } | null;
    locations?: Array<{ id: string; name: string }>;
  }>({
    queryKey: ["teachers", meData?.teacherProfileId, "my-day-sites"],
    queryFn: () => {
      const profileId = meData?.teacherProfileId;
      if (!profileId) throw new Error("No teacher profile");
      return getTeacherDetails(profileId);
    },
    enabled: Boolean(meData?.teacherProfileId),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: ({
      student_id,
      schedule_id,
      session_date,
      status,
      late_minutes,
      reason,
      reason_text,
      sibling_participant_ids,
    }: {
      student_id: string;
      schedule_id: string;
      session_date: string;
      status: AttendanceStatus;
      late_minutes?: number;
      reason?: AbsenceReason;
      reason_text?: string;
      sibling_participant_ids?: string[];
    }) =>
      markAttendance({
        student_id,
        schedule_id,
        session_date,
        status,
        late_minutes,
        reason,
        reason_text,
        sibling_participant_ids,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers", "myDay"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!photoFile || !photoLocationId) {
        throw new Error("Please select a location and image file");
      }

      const { upload_url, file_url } = await getPhotoUploadUrl({
        location_id: photoLocationId,
        student_id: photoStudentId || undefined,
        session_date: selectedDate,
        file_name: photoFile.name,
        content_type: photoFile.type || "image/jpeg",
      });

      const uploadResult = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": photoFile.type || "image/jpeg",
        },
        body: photoFile,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload photo file");
      }

      await createPhoto({
        location_id: photoLocationId,
        student_id: photoStudentId || undefined,
        session_date: selectedDate,
        caption: photoCaption || undefined,
        file_url,
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
      toast.success("Photo uploaded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload photo");
    },
  });

  const reportSickDayMutation = useMutation({
    mutationFn: async () => {
      let siteIdToUse: string | undefined = sickDaySiteId || siteOptions[0]?.id;

      if (!siteIdToUse) {
        const me = await getMe();
        const teacherProfileId = me.teacherProfileId;

        if (teacherProfileId) {
          const teacher = await getTeacherDetails(teacherProfileId);
          siteIdToUse =
            teacher.primary_site_id ||
            teacher.primarySite?.id ||
            teacher.locations?.[0]?.id ||
            undefined;
        }
      }

      return postTeacherSickDayNotice({
        notice_date: selectedDate,
        note: sickDayNote || undefined,
        site_id: siteIdToUse,
      });
    },
    onSuccess: () => {
      setSickDayDialogOpen(false);
      setSickDayNote("");
      setSickDaySiteId("");
      toast.success("Sick-day notice posted to parents");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post sick-day notice");
    },
  });

  const handleMarkAttendance = (session: SessionForDay, status: AttendanceStatus) => {
    // Store previous state for undo
    const previousStatus = session.attendance?.status || null;
    const previousLateMinutes = session.attendance?.late_minutes || null;
    const previousSiblingIds =
      session.attendance?.sibling_participants?.map((sp) => sp.sibling_id) ?? [];
    const siblingParticipantIds = getSiblingIdsForSession(session);

    if (status === "present") {
      // Mark as present directly
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: session.session_date,
        status: "present",
        sibling_participant_ids: siblingParticipantIds,
      });

      // Show undo snackbar
      setUndoSnackbar({
        open: true,
        session,
        previousStatus,
        previousLateMinutes,
        previousSiblingIds,
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
    const previousSiblingIds =
      selectedSession.attendance?.sibling_participants?.map((sp) => sp.sibling_id) ?? [];
    const siblingParticipantIds = getSiblingIdsForSession(selectedSession);

    markAttendanceMutation.mutate({
      student_id: selectedSession.student_id,
      schedule_id: selectedSession.schedule_id,
      session_date: selectedSession.session_date,
      status: selectedStatus,
      reason: selectedReason,
      reason_text: selectedReason === "other" ? reasonText : undefined,
      sibling_participant_ids: siblingParticipantIds,
    });

    setReasonDialogOpen(false);
    setUndoSnackbar({
      open: true,
      session: selectedSession,
      previousStatus,
      previousLateMinutes,
      previousSiblingIds,
    });
  };

  const handleConfirmLate = () => {
    if (!selectedSession || selectedStatus !== "late") return;

    const previousStatus = selectedSession.attendance?.status || null;
    const previousLateMinutes = selectedSession.attendance?.late_minutes || null;
    const previousSiblingIds =
      selectedSession.attendance?.sibling_participants?.map((sp) => sp.sibling_id) ?? [];
    const siblingParticipantIds = getSiblingIdsForSession(selectedSession);

    markAttendanceMutation.mutate({
      student_id: selectedSession.student_id,
      schedule_id: selectedSession.schedule_id,
      session_date: selectedSession.session_date,
      status: "late",
      late_minutes: selectedLateMinutes,
      sibling_participant_ids: siblingParticipantIds,
    });

    setLateDialogOpen(false);
    setUndoSnackbar({
      open: true,
      session: selectedSession,
      previousStatus,
      previousLateMinutes,
      previousSiblingIds,
    });
  };

  const handleUndo = () => {
    if (!undoSnackbar.session) return;

    const { session, previousStatus, previousLateMinutes, previousSiblingIds } = undoSnackbar;

    if (previousStatus) {
      // Restore previous status
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: session.session_date,
        status: previousStatus,
        late_minutes: previousStatus === "late" ? previousLateMinutes || 10 : undefined,
        sibling_participant_ids: previousSiblingIds,
      });
    }
    // Note: If there was no previous attendance, we can't truly "undo" - just close the snackbar
    // In a production app, you might want a DELETE endpoint for this case

    setUndoSnackbar({
      open: false,
      session: null,
      previousStatus: null,
      previousLateMinutes: null,
      previousSiblingIds: [],
    });
  };

  const handleReasonChange = (event: SelectChangeEvent<string>) => {
    const value = (event.target as { value: string }).value;
    setSelectedReason(value as AbsenceReason);
  };

  const openSiblingDialog = async (session: SessionForDay) => {
    try {
      const student = await getStudentDetails(session.student_id);
      const siblings = (student.siblings || [])
        .filter((sibling) => sibling.is_participant)
        .map((sibling) => ({
          id: sibling.id,
          name: sibling.name,
          relationship: sibling.relationship,
        }));

      setSiblingSession(session);
      setSiblingOptions(siblings);
      setSiblingDialogSelection(getSiblingIdsForSession(session));
      setSiblingDialogOpen(true);
    } catch {
      toast.error("Failed to load sibling list");
    }
  };

  const saveSiblingParticipants = () => {
    if (!siblingSession) {
      return;
    }

    const sessionKey = getSessionKey(siblingSession);
    setPendingSiblingSelections((prev) => ({
      ...prev,
      [sessionKey]: siblingDialogSelection,
    }));

    if (!siblingSession.attendance) {
      setSiblingDialogOpen(false);
      toast.info("Sibling participants will save with attendance");
      return;
    }

    const statusToUse = siblingSession.attendance?.status || "present";
    markAttendanceMutation.mutate({
      student_id: siblingSession.student_id,
      schedule_id: siblingSession.schedule_id,
      session_date: siblingSession.session_date,
      status: statusToUse,
      sibling_participant_ids: siblingDialogSelection,
    });
    setSiblingDialogOpen(false);
    toast.success("Sibling participation saved");
  };

  const handleReasonTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = (event.target as { value: string }).value;
    setReasonText(value);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={view === "day" ? "My Day" : "My Week"} />
        <SectionCard>
          <Stack spacing={2}>
            {Array.from({ length: 4 }, (_, i) => i).map((i) => (
              <Stack
                key={`skeleton-${i}`}
                direction="row"
                spacing={2}
                sx={{ alignItems: "center" }}
              >
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="25%" />
                </Box>
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={32}
                  sx={{ display: { xs: "none", sm: "block" } }}
                />
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="My Day" />
        <ErrorAlert message="Failed to load today's sessions." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const sessions = data?.sessions || [];
  const markedCount = sessions.filter((s) => s.attendance).length;
  const totalCount = sessions.length;

  // Group sessions by site
  const sessionsBySite = sessions.reduce(
    (acc, session) => {
      const key = `${session.session_date}::${session.site_id}`;
      if (!acc[key]) {
        acc[key] = {
          session_date: session.session_date,
          site_id: session.site_id,
          site_name: session.site_name,
          sessions: [],
        };
      }
      acc[key]?.sessions.push(session);
      return acc;
    },
    {} as Record<
      string,
      { session_date: string; site_id: string; site_name: string; sessions: SessionForDay[] }
    >,
  );

  const groupedSiteEntries = Object.entries(sessionsBySite).sort(([, a], [, b]) => {
    if (a.session_date !== b.session_date) {
      return a.session_date.localeCompare(b.session_date);
    }

    if (a.site_name !== b.site_name) {
      return a.site_name.localeCompare(b.site_name);
    }

    return a.site_id.localeCompare(b.site_id);
  });

  const sessionsByDay = sessions.reduce(
    (acc, session) => {
      if (!acc[session.session_date]) {
        acc[session.session_date] = 0;
      }
      acc[session.session_date] += 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const markedByDay = sessions.reduce(
    (acc, session) => {
      if (!session.attendance) {
        return acc;
      }

      if (!acc[session.session_date]) {
        acc[session.session_date] = 0;
      }

      acc[session.session_date] += 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedSessionDates = Array.from(
    new Set(sessions.map((session) => session.session_date)),
  ).sort((a, b) => a.localeCompare(b));
  const photoItems = photosData?.items || [];
  const siteEntries = [
    ...groupedSiteEntries.map(([, value]) => [value.site_id, value.site_name] as const),
    ...(teacherProfileData?.locations || []).map(
      (location) => [location.id, location.name] as const,
    ),
    ...(teacherProfileData?.primarySite
      ? ([
          [teacherProfileData.primarySite.id, teacherProfileData.primarySite.name] as const,
        ] as const)
      : []),
  ];

  const siteOptions = Array.from(new Map(siteEntries).entries()).map(([id, name]) => ({
    id,
    name,
  }));
  const studentOptions = sessions
    .filter((session) => !photoLocationId || session.site_id === photoLocationId)
    .map((session) => ({
      id: session.student_id,
      label: `${session.student_first_name} ${session.student_last_name} (${session.student_initials})`,
    }))
    .filter((student, index, arr) => arr.findIndex((item) => item.id === student.id) === index);

  const openSickDayDialog = () => {
    if (!sickDaySiteId && siteOptions[0]?.id) {
      setSickDaySiteId(siteOptions[0].id);
    }
    setSickDayDialogOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title={view === "day" ? "My Day" : "My Week"}
        breadcrumbs={[{ label: view === "day" ? "My Day" : "My Week" }]}
        actions={
          <>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center" }}
            >
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
                  color: "primary.contrastText",
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
            <Button
              variant="outlined"
              color="error"
              onClick={openSickDayDialog}
              disabled={view !== "day"}
            >
              Report Sick Day
            </Button>
          </>
        }
      />

      <Stack spacing={3}>
        <SectionCard title="Session Photos" icon={<PhotoCameraIcon />}>
          {view === "week" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Photo uploads are available in Day view only.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
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

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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

          <Stack direction="row" sx={{ mb: 2, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => uploadPhotoMutation.mutate()}
              disabled={
                view !== "day" || !photoLocationId || !photoFile || uploadPhotoMutation.isPending
              }
            >
              {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
            </Button>
          </Stack>

          {photoItems.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              {photoItems.map((photo) => (
                <Card key={photo.id} variant="outlined">
                  <Box
                    component="img"
                    src={photo.file_url}
                    alt={photo.caption || photo.file_name}
                    sx={{ width: "100%", height: 160, objectFit: "cover" }}
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {photo.location.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
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
        </SectionCard>

        {sessions.length === 0 ? (
          <SectionCard>
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              {view === "day"
                ? "No sessions scheduled for today."
                : "No sessions scheduled for this week."}
            </Typography>
          </SectionCard>
        ) : (
          <>
            {view === "week" && sortedSessionDates.length > 0 && (
              <SectionCard>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Week At A Glance
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                >
                  {sortedSessionDates.map((date) => {
                    const totalForDay = sessionsByDay[date] ?? 0;
                    const markedForDay = markedByDay[date] ?? 0;

                    return (
                      <Chip
                        key={date}
                        label={`${new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}: ${markedForDay}/${totalForDay} marked`}
                        color={markedForDay === totalForDay ? "success" : "default"}
                        variant={markedForDay === totalForDay ? "filled" : "outlined"}
                      />
                    );
                  })}
                </Stack>
              </SectionCard>
            )}

            {groupedSiteEntries.map(
              ([groupKey, { session_date, site_name, sessions: siteSessions }]) => (
                <SectionCard key={groupKey} noPadding>
                  <Box sx={{ px: 3, py: 2, bgcolor: "grey.100" }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(`${session_date}T00:00:00`).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
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
                                onClick={() =>
                                  router.push(`/teachers/students/${session.student_id}`)
                                }
                              >
                                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                                  {session.student_initials}
                                </Avatar>

                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                                    {session.student_first_name} {session.student_last_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatTime(session.start_time)} -{" "}
                                    {formatTime(session.end_time)}
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
                                  {session.attendance.sibling_participants &&
                                    session.attendance.sibling_participants.length > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        Siblings:{" "}
                                        {session.attendance.sibling_participants
                                          .map((sp) => sp.name)
                                          .join(", ")}
                                      </Typography>
                                    )}
                                  <Button size="small" onClick={() => openSiblingDialog(session)}>
                                    Siblings
                                  </Button>
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
                                    color="inherit"
                                    onClick={() => openSiblingDialog(session)}
                                    disabled={markAttendanceMutation.isPending}
                                  >
                                    Siblings
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
                </SectionCard>
              ),
            )}

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
      </Stack>

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
              <Select value={selectedReason} label="Reason" onChange={handleReasonChange}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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

      <Dialog
        open={lateDialogOpen}
        onClose={() => setLateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Mark as Late</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Student: {selectedSession?.student_first_name} {selectedSession?.student_last_name}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Late By</InputLabel>
              <Select
                value={String(selectedLateMinutes)}
                label="Late By"
                onChange={(event) =>
                  setSelectedLateMinutes(
                    Number((event.target as unknown as { value: string }).value),
                  )
                }
              >
                <MenuItem value="10">10 minutes</MenuItem>
                <MenuItem value="15">15 minutes</MenuItem>
                <MenuItem value="30">30 minutes</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
            previousSiblingIds: [],
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

      <Dialog
        open={sickDayDialogOpen}
        onClose={() => setSickDayDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Sick Day</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This creates a parent-facing location announcement for {selectedDate}.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Location (optional)</InputLabel>
              <Select
                value={sickDaySiteId}
                label="Location (optional)"
                onChange={(event) => setSickDaySiteId(event.target.value)}
              >
                <MenuItem value="">Use teacher default site</MenuItem>
                {siteOptions.map((site) => (
                  <MenuItem key={`sick-day-${site.id}`} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Optional note for families"
              value={sickDayNote}
              onChange={(event) => setSickDayNote((event.target as { value: string }).value)}
              multiline
              minRows={3}
              placeholder="Today's sessions are impacted due to illness..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSickDayDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => reportSickDayMutation.mutate()}
            disabled={reportSickDayMutation.isPending}
          >
            {reportSickDayMutation.isPending ? "Submitting..." : "Submit Notice"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={siblingDialogOpen}
        onClose={() => setSiblingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sibling Participants</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {siblingOptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No participant siblings available for this student.
              </Typography>
            ) : (
              siblingOptions.map((sibling) => {
                const selected = siblingDialogSelection.includes(sibling.id);
                return (
                  <Button
                    key={sibling.id}
                    variant={selected ? "contained" : "outlined"}
                    onClick={() => {
                      setSiblingDialogSelection((prev) =>
                        prev.includes(sibling.id)
                          ? prev.filter((id) => id !== sibling.id)
                          : [...prev, sibling.id],
                      );
                    }}
                    sx={{ justifyContent: "space-between" }}
                  >
                    {sibling.name}
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {sibling.relationship}
                    </Typography>
                  </Button>
                );
              })
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSiblingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSiblingParticipants}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
