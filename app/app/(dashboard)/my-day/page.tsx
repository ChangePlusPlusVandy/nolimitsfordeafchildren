"use client";

import { Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AbsenceReason, AttendanceStatus } from "@/client/attendance";
import { markAttendance } from "@/client/attendance";
import ErrorAlert from "@/client/components/ErrorAlert";
import AbsenceReasonDialog from "@/client/components/my-day/AbsenceReasonDialog";
import AttendanceProgressFooter from "@/client/components/my-day/AttendanceProgressFooter";
import LateDialog from "@/client/components/my-day/LateDialog";
import MyDayLoadingSkeleton from "@/client/components/my-day/MyDayLoadingSkeleton";
import SessionPhotoUpload from "@/client/components/my-day/SessionPhotoUpload";
import SiblingParticipantsDialog from "@/client/components/my-day/SiblingParticipantsDialog";
import SickDayDialog from "@/client/components/my-day/SickDayDialog";
import SiteSessionGroup from "@/client/components/my-day/SiteSessionGroup";
import type { SessionPhoto, SiteOption } from "@/client/components/my-day/types";
import UndoSnackbar, {
  EMPTY_UNDO_STATE,
  type UndoSnackbarState,
} from "@/client/components/my-day/UndoSnackbar";
import WeekAtAGlance from "@/client/components/my-day/WeekAtAGlance";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { getMe } from "@/client/me";
import { createPhoto, getPhotoUploadUrl, listSessionPhotos } from "@/client/sessions";
import { getStudentDetails } from "@/client/students";
import {
  getMyDay,
  getTeacherDetails,
  type MyDayResponse,
  postTeacherSickDayNotice,
  type SessionForDay,
} from "@/client/teachers";
import {
  formatDateOnlyWeekdayLong,
  getWeekDatesFromDateStr,
  getWeekRangeLabels,
  todayStrOrg,
} from "@/client/utils/date";

export default function MyDayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedDate] = useState(() => todayStrOrg());
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [lateDialogOpen, setLateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionForDay | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [selectedLateMinutes, setSelectedLateMinutes] = useState<number>(10);
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | "">("");
  const [reasonText, setReasonText] = useState("");
  const [view, setView] = useState<"day" | "week">("day");
  const [undoSnackbar, setUndoSnackbar] = useState<UndoSnackbarState>(EMPTY_UNDO_STATE);
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

  const weekDates = getWeekDatesFromDateStr(selectedDate);
  const { startOfWeek, endOfWeek } = getWeekRangeLabels(selectedDate);
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

      const uploadFormData = new FormData();
      uploadFormData.append("file", photoFile);
      const uploadResult = await fetch(upload_url, {
        method: "POST",
        body: uploadFormData,
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
    const previousStatus = session.attendance?.status || null;
    const previousLateMinutes = session.attendance?.late_minutes || null;
    const previousSiblingIds =
      session.attendance?.sibling_participants?.map((sp) => sp.sibling_id) ?? [];
    const siblingParticipantIds = getSiblingIdsForSession(session);

    if (status === "present") {
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: session.session_date,
        status: "present",
        sibling_participant_ids: siblingParticipantIds,
      });

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
      markAttendanceMutation.mutate({
        student_id: session.student_id,
        schedule_id: session.schedule_id,
        session_date: session.session_date,
        status: previousStatus,
        late_minutes: previousStatus === "late" ? previousLateMinutes || 10 : undefined,
        sibling_participant_ids: previousSiblingIds,
      });
    }

    setUndoSnackbar(EMPTY_UNDO_STATE);
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

  if (isLoading) {
    return <MyDayLoadingSkeleton view={view} />;
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

  const siteOptions: SiteOption[] = Array.from(new Map(siteEntries).entries()).map(
    ([id, name]) => ({
      id,
      name,
    }),
  );
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
                ? formatDateOnlyWeekdayLong(selectedDate)
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
        <SessionPhotoUpload
          view={view}
          photoLocationId={photoLocationId}
          photoStudentId={photoStudentId}
          photoCaption={photoCaption}
          photoFile={photoFile}
          photoItems={photoItems}
          siteOptions={siteOptions}
          studentOptions={studentOptions}
          isUploading={uploadPhotoMutation.isPending}
          onLocationChange={setPhotoLocationId}
          onStudentChange={setPhotoStudentId}
          onCaptionChange={setPhotoCaption}
          onFileChange={setPhotoFile}
          onUpload={() => uploadPhotoMutation.mutate()}
        />

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
              <WeekAtAGlance
                sortedSessionDates={sortedSessionDates}
                sessionsByDay={sessionsByDay}
                markedByDay={markedByDay}
              />
            )}

            {groupedSiteEntries.map(
              ([groupKey, { session_date, site_name, sessions: siteSessions }]) => (
                <SiteSessionGroup
                  key={groupKey}
                  sessionDate={session_date}
                  siteName={site_name}
                  sessions={siteSessions}
                  isMarking={markAttendanceMutation.isPending}
                  onStudentClick={(studentId) => router.push(`/teachers/students/${studentId}`)}
                  onMarkAttendance={handleMarkAttendance}
                  onOpenSiblingDialog={openSiblingDialog}
                />
              ),
            )}

            <AttendanceProgressFooter markedCount={markedCount} totalCount={totalCount} />
          </>
        )}
      </Stack>

      <AbsenceReasonDialog
        open={reasonDialogOpen}
        selectedSession={selectedSession}
        selectedStatus={selectedStatus}
        selectedReason={selectedReason}
        reasonText={reasonText}
        onClose={() => setReasonDialogOpen(false)}
        onConfirm={handleConfirmAbsence}
        onReasonChange={handleReasonChange}
        onReasonTextChange={setReasonText}
      />

      <LateDialog
        open={lateDialogOpen}
        selectedSession={selectedSession}
        selectedLateMinutes={selectedLateMinutes}
        onClose={() => setLateDialogOpen(false)}
        onConfirm={handleConfirmLate}
        onLateMinutesChange={setSelectedLateMinutes}
      />

      <UndoSnackbar
        open={undoSnackbar.open}
        session={undoSnackbar.session}
        onClose={() => setUndoSnackbar(EMPTY_UNDO_STATE)}
        onUndo={handleUndo}
      />

      <SickDayDialog
        open={sickDayDialogOpen}
        selectedDate={selectedDate}
        sickDaySiteId={sickDaySiteId}
        sickDayNote={sickDayNote}
        siteOptions={siteOptions}
        isSubmitting={reportSickDayMutation.isPending}
        onClose={() => setSickDayDialogOpen(false)}
        onSubmit={() => reportSickDayMutation.mutate()}
        onSiteChange={setSickDaySiteId}
        onNoteChange={setSickDayNote}
      />

      <SiblingParticipantsDialog
        open={siblingDialogOpen}
        siblingOptions={siblingOptions}
        siblingDialogSelection={siblingDialogSelection}
        onClose={() => setSiblingDialogOpen(false)}
        onSave={saveSiblingParticipants}
        onToggleSibling={(siblingId) => {
          setSiblingDialogSelection((prev) =>
            prev.includes(siblingId) ? prev.filter((id) => id !== siblingId) : [...prev, siblingId],
          );
        }}
      />
    </PageContainer>
  );
}
