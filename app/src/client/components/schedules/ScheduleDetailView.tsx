"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/client/components/ConfirmDialog";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { DetailPageSkeleton } from "@/client/components/skeletons";
import { useToast } from "@/client/components/ToastProvider";
import {
  checkScheduleConflicts,
  endEnrollment,
  getScheduleDetails,
  reenrollStudent,
  type ScheduleDetails,
  type UpdateScheduleInput,
  updateSchedule,
} from "@/client/schedules";
import { listSessions } from "@/client/sessions";
import {
  decodeDayMask,
  encodeDayMask,
  getTeacherLocations,
  SCHEDULE_PATTERNS,
} from "@/client/teachers";
import { formatDate, formatTime } from "@/client/utils/formatDate";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ScheduleFormState {
  patternType: "preset" | "custom";
  selectedPattern: "MWS" | "TThS";
  customDays: string[];
  siteId: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  cycleStartDate: string;
  cycleEndDate: string;
  isActive: boolean;
}

function toTimeInput(value: string): string {
  const match = /^(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? value;
}

function daySelectionFromMask(
  mask: number,
): Pick<ScheduleFormState, "patternType" | "selectedPattern" | "customDays"> {
  if (mask === SCHEDULE_PATTERNS.MWS.mask) {
    return { patternType: "preset", selectedPattern: "MWS", customDays: [] };
  }
  if (mask === SCHEDULE_PATTERNS.TThS.mask) {
    return { patternType: "preset", selectedPattern: "TThS", customDays: [] };
  }
  return { patternType: "custom", selectedPattern: "MWS", customDays: decodeDayMask(mask) };
}

function formFromSchedule(schedule: ScheduleDetails): ScheduleFormState {
  return {
    ...daySelectionFromMask(schedule.day_of_week_mask),
    siteId: schedule.site_id,
    sessionId: schedule.session_id ?? "",
    startTime: toTimeInput(schedule.start_time),
    endTime: toTimeInput(schedule.end_time),
    cycleStartDate: schedule.cycle_start_date,
    cycleEndDate: schedule.cycle_end_date,
    isActive: schedule.is_active,
  };
}

function studentName(student: { first_name: string; last_name: string; initials: string }): string {
  const name = `${student.first_name} ${student.last_name}`.trim();
  return name || student.initials;
}

function dayMaskFromForm(form: ScheduleFormState): number {
  if (form.patternType === "preset") {
    return SCHEDULE_PATTERNS[form.selectedPattern].mask;
  }
  return encodeDayMask(form.customDays);
}

interface ScheduleDetailViewProps {
  scheduleId: string;
  initialData: ScheduleDetails | null;
}

export default function ScheduleDetailView({ scheduleId, initialData }: ScheduleDetailViewProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<ScheduleFormState | null>(() =>
    initialData ? formFromSchedule(initialData) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [endingEnrollment, setEndingEnrollment] = useState<{
    enrollmentId: string;
    name: string;
  } | null>(null);

  const {
    data: schedule,
    isLoading,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ["schedules", "show", scheduleId],
    queryFn: () => getScheduleDetails(scheduleId),
    initialData: initialData ?? undefined,
    enabled: !!scheduleId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const hydratedStamp = useRef("");

  useEffect(() => {
    if (!schedule) return;
    const stamp = `${schedule.id}:${String(schedule.updated_at)}`;
    if (hydratedStamp.current === stamp) return;
    hydratedStamp.current = stamp;
    setForm(formFromSchedule(schedule));
  }, [schedule]);

  const teacherId = schedule?.teacher.id ?? "";

  const { data: teacherLocations = [] } = useQuery({
    queryKey: ["teachers", "locations", teacherId],
    queryFn: () => getTeacherLocations(teacherId),
    enabled: !!teacherId,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", "list", "schedule-edit"],
    queryFn: () => listSessions({ include_archived: false, page: 1, limit: 200 }),
    enabled: !!schedule,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: UpdateScheduleInput & { schedulingChanged: boolean }) => {
      if (!schedule) {
        throw new Error("Schedule not found");
      }
      const { schedulingChanged, ...payload } = input;
      if (schedulingChanged) {
        const result = await checkScheduleConflicts({
          teacher_id: schedule.teacher_id,
          day_of_week_mask: payload.day_of_week_mask ?? schedule.day_of_week_mask,
          start_time: payload.start_time ?? schedule.start_time,
          end_time: payload.end_time ?? schedule.end_time,
          cycle_start_date: payload.cycle_start_date ?? schedule.cycle_start_date,
          cycle_end_date: payload.cycle_end_date ?? schedule.cycle_end_date,
          exclude_schedule_id: schedule.id,
        });
        if (result.hasConflict) {
          throw new Error(
            `Schedule conflicts with existing schedules: ${result.conflicts.map((conflict) => conflict.id).join(", ")}`,
          );
        }
      }
      return updateSchedule({ scheduleId: schedule.id, ...payload });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["schedules", "show", scheduleId] });
      if (teacherId) {
        await queryClient.invalidateQueries({ queryKey: ["teachers", "show", teacherId] });
      }
      toast.success("Schedule updated");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update schedule");
    },
  });

  const endEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) => endEnrollment({ scheduleId, enrollmentId }),
    onSuccess: async () => {
      setEndingEnrollment(null);
      await queryClient.invalidateQueries({ queryKey: ["schedules", "show", scheduleId] });
      toast.success("Enrollment ended");
    },
    onError: (err: Error) => {
      setEndingEnrollment(null);
      toast.error(err.message || "Failed to end enrollment");
    },
  });

  const reenrollMutation = useMutation({
    mutationFn: (studentId: string) => reenrollStudent({ scheduleId, studentId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedules", "show", scheduleId] });
      toast.success("Student re-enrolled");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to re-enroll student");
    },
  });

  const backHref = schedule ? `/teachers/${schedule.teacher.id}` : "/teachers";
  const breadcrumbs = [
    { label: "Teachers", href: "/teachers" },
    ...(schedule
      ? [{ label: schedule.teacher.user.name, href: `/teachers/${schedule.teacher.id}` }]
      : []),
    { label: "Schedule" },
  ];

  if (isLoading || (schedule && !form)) {
    return (
      <PageContainer>
        <PageHeader title="Schedule" breadcrumbs={breadcrumbs} back={backHref} />
        <DetailPageSkeleton sections={3} />
      </PageContainer>
    );
  }

  if (loadError || !schedule || !form) {
    return (
      <PageContainer>
        <PageHeader title="Schedule" breadcrumbs={breadcrumbs} back="/teachers" />
        <ErrorAlert message="Schedule not found or access denied." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const siteOptions = [...teacherLocations];
  if (!siteOptions.some((site) => site.id === schedule.site.id)) {
    siteOptions.unshift({ id: schedule.site.id, name: schedule.site.name });
  }

  const sessionOptions: Array<{
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
  }> = (sessionsData?.items ?? []).map((session) => ({
    id: session.id,
    name: session.name,
    start_date: session.start_date,
    end_date: session.end_date,
  }));
  if (schedule.session && !sessionOptions.some((session) => session.id === schedule.session?.id)) {
    sessionOptions.unshift({
      id: schedule.session.id,
      name: schedule.session.name,
      start_date: schedule.cycle_start_date,
      end_date: schedule.cycle_end_date,
    });
  }

  const dayMask = dayMaskFromForm(form);

  const handleSave = () => {
    setError(null);
    if (!form.siteId) {
      setError("Please select a site");
      return;
    }
    if (dayMask === 0) {
      setError("Please select at least one day");
      return;
    }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setError("End time must be after start time");
      return;
    }
    if (!form.cycleStartDate || !form.cycleEndDate || form.cycleStartDate > form.cycleEndDate) {
      setError("Cycle end date must be on or after the start date");
      return;
    }

    const schedulingChanged =
      dayMask !== schedule.day_of_week_mask ||
      form.startTime !== toTimeInput(schedule.start_time) ||
      form.endTime !== toTimeInput(schedule.end_time) ||
      form.cycleStartDate !== schedule.cycle_start_date ||
      form.cycleEndDate !== schedule.cycle_end_date;

    saveMutation.mutate({
      site_id: form.siteId,
      session_id: form.sessionId || null,
      day_of_week_mask: dayMask,
      start_time: form.startTime,
      end_time: form.endTime,
      cycle_start_date: form.cycleStartDate,
      cycle_end_date: form.cycleEndDate,
      is_active: form.isActive,
      schedulingChanged,
    });
  };

  const handleSessionChange = (event: SelectChangeEvent<string>) => {
    const nextSessionId = event.target.value;
    const session = sessionOptions.find((item) => item.id === nextSessionId);
    setForm((current) =>
      current
        ? {
            ...current,
            sessionId: nextSessionId,
            cycleStartDate: session?.start_date ?? current.cycleStartDate,
            cycleEndDate: session?.end_date ?? current.cycleEndDate,
          }
        : current,
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Schedule"
        subtitle={`${schedule.teacher.user.name} · ${schedule.site.name}`}
        back={backHref}
        breadcrumbs={breadcrumbs}
      />

      <Stack spacing={3}>
        <SectionCard title="Details">
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography>
                {decodeDayMask(schedule.day_of_week_mask).join("/")} ·{" "}
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </Typography>
              <Chip
                label={schedule.is_active ? "Active" : "Inactive"}
                size="small"
                color={schedule.is_active ? "success" : "default"}
                variant={schedule.is_active ? "filled" : "outlined"}
              />
              {schedule.session?.name && (
                <Chip label={schedule.session.name} size="small" variant="outlined" />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {schedule.site.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cycle: {formatDate(schedule.cycle_start_date)} to{" "}
              {formatDate(schedule.cycle_end_date)}
            </Typography>
            <Typography variant="body2">
              Saved times: {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Edit schedule">
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel id="schedule-site-label">Site</InputLabel>
              <Select
                labelId="schedule-site-label"
                label="Site"
                value={form.siteId}
                onChange={(event: SelectChangeEvent<string>) =>
                  setForm((current) =>
                    current ? { ...current, siteId: event.target.value } : current,
                  )
                }
              >
                {siteOptions.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="schedule-session-label">Session</InputLabel>
              <Select
                labelId="schedule-session-label"
                label="Session"
                value={form.sessionId}
                onChange={handleSessionChange}
              >
                <MenuItem value="">
                  <em>No session</em>
                </MenuItem>
                {sessionOptions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="schedule-pattern-label">Days</InputLabel>
              <Select
                labelId="schedule-pattern-label"
                label="Days"
                value={form.patternType}
                onChange={(event: SelectChangeEvent<"preset" | "custom">) =>
                  setForm((current) =>
                    current
                      ? { ...current, patternType: event.target.value as "preset" | "custom" }
                      : current,
                  )
                }
              >
                <MenuItem value="preset">Preset pattern</MenuItem>
                <MenuItem value="custom">Custom days</MenuItem>
              </Select>
            </FormControl>

            {form.patternType === "preset" ? (
              <ToggleButtonGroup
                exclusive
                value={form.selectedPattern}
                onChange={(_, value: "MWS" | "TThS" | null) => {
                  if (!value) return;
                  setForm((current) =>
                    current ? { ...current, selectedPattern: value } : current,
                  );
                }}
                fullWidth
              >
                <ToggleButton value="MWS">{SCHEDULE_PATTERNS.MWS.label}</ToggleButton>
                <ToggleButton value="TThS">{SCHEDULE_PATTERNS.TThS.label}</ToggleButton>
              </ToggleButtonGroup>
            ) : (
              <ToggleButtonGroup
                value={form.customDays}
                onChange={(_, value: string[]) =>
                  setForm((current) => (current ? { ...current, customDays: value } : current))
                }
                fullWidth
              >
                {DAYS.map((day) => (
                  <ToggleButton key={day} value={day} size="small">
                    {day}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start time"
                type="time"
                value={form.startTime}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((current) =>
                    current ? { ...current, startTime: event.target.value } : current,
                  )
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End time"
                type="time"
                value={form.endTime}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((current) =>
                    current ? { ...current, endTime: event.target.value } : current,
                  )
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Cycle start"
                type="date"
                value={form.cycleStartDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((current) =>
                    current ? { ...current, cycleStartDate: event.target.value } : current,
                  )
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Cycle end"
                type="date"
                value={form.cycleEndDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((current) =>
                    current ? { ...current, cycleEndDate: event.target.value } : current,
                  )
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, isActive: event.target.checked } : current,
                    )
                  }
                />
              }
              label="Active"
            />

            <Box>
              <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save schedule"}
              </Button>
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard title="Enrollments" noPadding>
          <Box sx={{ px: 2.5, pt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Enrolled
            </Typography>
          </Box>
          {schedule.enrolledStudents.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 2.5, py: 2 }}>
              No students enrolled
            </Typography>
          ) : (
            <List disablePadding>
              {schedule.enrolledStudents.map((student) => {
                const name = studentName(student);
                return (
                  <ListItem
                    key={student.enrollment_id}
                    secondaryAction={
                      <Button
                        size="small"
                        color="error"
                        aria-label={`End enrollment for ${name}`}
                        onClick={() =>
                          setEndingEnrollment({ enrollmentId: student.enrollment_id, name })
                        }
                        disabled={endEnrollmentMutation.isPending}
                      >
                        End enrollment
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={name}
                      secondary={`Enrolled ${formatDate(student.enrolled_at)}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          <Divider />

          <Box sx={{ px: 2.5, pt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Ended enrollments
            </Typography>
          </Box>
          {schedule.endedEnrollments.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 2.5, py: 2 }}>
              No ended enrollments
            </Typography>
          ) : (
            <List disablePadding>
              {schedule.endedEnrollments.map((student) => {
                const name = studentName(student);
                return (
                  <ListItem
                    key={student.enrollment_id}
                    secondaryAction={
                      <Button
                        size="small"
                        aria-label={`Re-enroll ${name}`}
                        onClick={() => reenrollMutation.mutate(student.id)}
                        disabled={reenrollMutation.isPending}
                      >
                        Re-enroll
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={name}
                      secondary={`Ended ${formatDate(student.ended_at)}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </SectionCard>
      </Stack>

      <ConfirmDialog
        open={!!endingEnrollment}
        title="End enrollment"
        message={
          endingEnrollment
            ? `End ${endingEnrollment.name}'s enrollment in this schedule? They can be re-enrolled later.`
            : ""
        }
        confirmLabel="End enrollment"
        confirmColor="error"
        loading={endEnrollmentMutation.isPending}
        onConfirm={() => {
          if (endingEnrollment) {
            endEnrollmentMutation.mutate(endingEnrollment.enrollmentId);
          }
        }}
        onCancel={() => {
          if (!endEnrollmentMutation.isPending) {
            setEndingEnrollment(null);
          }
        }}
      />
    </PageContainer>
  );
}
