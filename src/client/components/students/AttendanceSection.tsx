"use client";

import EditIcon from "@mui/icons-material/Edit";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateAttendance } from "@/client/attendance";
import SectionCard from "@/client/components/SectionCard";
import {
  ABSENCE_REASON_OPTIONS,
  type AbsenceReason,
  type AttendanceStatus,
  attendanceStatusColor,
  formatRoleLabel,
} from "@/client/components/students/studentDetailUtils";
import { useToast } from "@/client/components/ToastProvider";
import type { AttendanceOverview } from "@/client/students";
import { formatDate, formatDateTime } from "@/client/utils/formatDate";

interface AttendanceSectionProps {
  studentId: string;
  attendanceOverview: AttendanceOverview | null;
  mode: "admin" | "teacher";
}

export default function AttendanceSection({
  studentId,
  attendanceOverview,
  mode,
}: AttendanceSectionProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const canEdit = mode === "admin";

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [editingAttendanceStatus, setEditingAttendanceStatus] =
    useState<AttendanceStatus>("present");
  const [editingAttendanceLateMinutes, setEditingAttendanceLateMinutes] = useState(10);
  const [editingAttendanceReason, setEditingAttendanceReason] = useState<AbsenceReason | "">("");
  const [editingAttendanceReasonText, setEditingAttendanceReasonText] = useState("");

  const patchAttendanceMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      setAttendanceDialogOpen(false);
      setEditingAttendanceId(null);
      setEditingAttendanceStatus("present");
      setEditingAttendanceLateMinutes(10);
      setEditingAttendanceReason("");
      setEditingAttendanceReasonText("");
      toast.success("Attendance updated");
    },
    onError: () => {
      toast.error("Failed to update attendance");
    },
  });

  const openAttendanceDialog = (entry: {
    id: string;
    status: AttendanceStatus;
    late_minutes: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
  }) => {
    setEditingAttendanceId(entry.id);
    setEditingAttendanceStatus(entry.status);
    setEditingAttendanceLateMinutes(entry.late_minutes ?? 10);
    setEditingAttendanceReason(entry.reason || "");
    setEditingAttendanceReasonText(entry.reason_text || "");
    setAttendanceDialogOpen(true);
  };

  const handleAttendanceUpdate = () => {
    if (!editingAttendanceId) {
      return;
    }

    const requiresReason =
      editingAttendanceStatus === "no_show" || editingAttendanceStatus === "cancelled";
    if (requiresReason && !editingAttendanceReason) {
      return;
    }

    if (editingAttendanceReason === "other" && !editingAttendanceReasonText.trim()) {
      return;
    }

    patchAttendanceMutation.mutate({
      id: editingAttendanceId,
      status: editingAttendanceStatus,
      late_minutes: editingAttendanceStatus === "late" ? editingAttendanceLateMinutes : undefined,
      reason: requiresReason ? (editingAttendanceReason as AbsenceReason) : undefined,
      reason_text:
        editingAttendanceReason === "other" ? editingAttendanceReasonText.trim() : undefined,
    });
  };

  if (!attendanceOverview) {
    return (
      <SectionCard title="Attendance" icon={<EventAvailableIcon />}>
        <Typography color="text.secondary">Attendance data unavailable.</Typography>
      </SectionCard>
    );
  }

  const isCompact = mode === "teacher";

  return (
    <>
      <SectionCard
        title={isCompact ? "Attendance Summary" : "Attendance"}
        icon={<EventAvailableIcon />}
      >
        {isCompact ? (
          <Stack spacing={1}>
            <Chip label={`Present: ${attendanceOverview.present}`} color="success" size="small" />
            <Chip label={`No-show: ${attendanceOverview.no_show}`} color="error" size="small" />
            <Chip label={`Cancelled: ${attendanceOverview.cancelled}`} size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              Attendance rate: {attendanceOverview.attendance_rate}% ({attendanceOverview.total}{" "}
              total)
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Recent Entries</Typography>
            {attendanceOverview.recent_entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No attendance entries.
              </Typography>
            ) : (
              <List dense sx={{ p: 0 }}>
                {attendanceOverview.recent_entries.map((entry) => (
                  <ListItem key={entry.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={formatDate(entry.session_date)}
                      secondary={
                        <Chip
                          size="small"
                          label={entry.status.replace("_", " ")}
                          color={attendanceStatusColor(entry.status)}
                          sx={{ textTransform: "capitalize" }}
                        />
                      }
                      slotProps={{ secondary: { component: "div" } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                mb: 2,
              }}
            >
              <Chip label={`Present: ${attendanceOverview.present}`} color="success" size="small" />
              <Chip label={`Late: ${attendanceOverview.late}`} color="warning" size="small" />
              <Chip label={`No-show: ${attendanceOverview.no_show}`} color="error" size="small" />
              <Chip label={`Cancelled: ${attendanceOverview.cancelled}`} size="small" />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Attendance rate: {attendanceOverview.attendance_rate}% ({attendanceOverview.total}{" "}
              total)
            </Typography>

            {attendanceOverview.recent_entries.length > 0 ? (
              <List dense sx={{ p: 0 }}>
                {attendanceOverview.recent_entries.map((entry, index) => (
                  <Box key={entry.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={formatDate(entry.session_date)}
                        secondary={
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              label={entry.status.replace("_", " ")}
                              size="small"
                              color={attendanceStatusColor(entry.status)}
                              sx={{ textTransform: "capitalize" }}
                            />
                            {entry.reason && (
                              <Typography component="span" variant="body2">
                                Reason: {entry.reason.replace(/_/g, " ")}
                              </Typography>
                            )}
                            {entry.late_minutes != null && (
                              <Typography component="span" variant="body2">
                                Late by {entry.late_minutes} min
                              </Typography>
                            )}
                            {entry.reason_text && (
                              <Typography component="span" variant="body2">
                                ({entry.reason_text})
                              </Typography>
                            )}
                            {entry.marked_by && (
                              <Typography component="span" variant="body2">
                                - Marked by {entry.marked_by.name} (
                                {formatRoleLabel(entry.marked_by.role)}) on{" "}
                                {formatDateTime(entry.marked_at)}
                              </Typography>
                            )}
                          </Box>
                        }
                        slotProps={{ secondary: { component: "div" } }}
                      />
                      {canEdit && (
                        <IconButton
                          size="small"
                          onClick={() => openAttendanceDialog(entry)}
                          aria-label="Edit attendance"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </ListItem>
                  </Box>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No attendance records yet.</Typography>
            )}
          </>
        )}
      </SectionCard>

      {canEdit && (
        <Dialog
          open={attendanceDialogOpen}
          onClose={() => setAttendanceDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Attendance</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingAttendanceStatus}
                  label="Status"
                  onChange={(event) => {
                    const value = (event.target as unknown as { value: AttendanceStatus }).value;
                    setEditingAttendanceStatus(value);
                    if (value !== "late") {
                      setEditingAttendanceLateMinutes(10);
                    }
                    if (value === "present" || value === "late") {
                      setEditingAttendanceReason("");
                      setEditingAttendanceReasonText("");
                    }
                  }}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="no_show">No Show</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              {editingAttendanceStatus === "late" && (
                <FormControl fullWidth>
                  <InputLabel>Late By</InputLabel>
                  <Select
                    value={String(editingAttendanceLateMinutes)}
                    label="Late By"
                    onChange={(event) =>
                      setEditingAttendanceLateMinutes(
                        Number((event.target as unknown as { value: string }).value),
                      )
                    }
                  >
                    <MenuItem value="10">10 minutes</MenuItem>
                    <MenuItem value="15">15 minutes</MenuItem>
                    <MenuItem value="30">30 minutes</MenuItem>
                  </Select>
                </FormControl>
              )}

              {(editingAttendanceStatus === "no_show" ||
                editingAttendanceStatus === "cancelled") && (
                <FormControl fullWidth>
                  <InputLabel>Reason</InputLabel>
                  <Select
                    value={editingAttendanceReason}
                    label="Reason"
                    onChange={(event) =>
                      setEditingAttendanceReason(
                        (event.target as unknown as { value: AbsenceReason | "" }).value,
                      )
                    }
                  >
                    {ABSENCE_REASON_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {editingAttendanceReason === "other" && (
                <TextField
                  label="Reason Details"
                  value={editingAttendanceReasonText}
                  onChange={(event) =>
                    setEditingAttendanceReasonText(
                      (event.target as unknown as { value: string }).value,
                    )
                  }
                  multiline
                  minRows={2}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAttendanceDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAttendanceUpdate}
              disabled={
                patchAttendanceMutation.isPending ||
                ((editingAttendanceStatus === "no_show" ||
                  editingAttendanceStatus === "cancelled") &&
                  !editingAttendanceReason) ||
                (editingAttendanceReason === "other" && !editingAttendanceReasonText.trim())
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
