"use client";

import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import SectionCard from "@/client/components/SectionCard";
import {
  calculateAge,
  decodeDayMask,
  formatHearingLossType,
} from "@/client/components/students/studentDetailUtils";
import { useToast } from "@/client/components/ToastProvider";
import type { StudentDetails } from "@/client/students";
import { updateGuardianSummary } from "@/client/students";
import { formatDate } from "@/client/utils/formatDate";

interface StudentHeaderProps {
  student: StudentDetails;
  studentId: string;
  mode: "admin" | "teacher";
  onEdit?: () => void;
}

export default function StudentHeader({ student, studentId, mode, onEdit }: StudentHeaderProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [guardianSummaryEditOpen, setGuardianSummaryEditOpen] = useState(false);
  const [guardianSummaryDraft, setGuardianSummaryDraft] = useState("");

  const updateGuardianSummaryMutation = useMutation({
    mutationFn: (guardianSummary: string) => updateGuardianSummary(studentId, guardianSummary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      setGuardianSummaryEditOpen(false);
      toast.success("Guardian summary updated");
    },
    onError: () => {
      toast.error("Failed to update guardian summary");
    },
  });

  const scheduleSummary = useMemo(() => {
    if (!student.active_schedules || student.active_schedules.length === 0) {
      return "No active schedule assigned";
    }

    return student.active_schedules
      .map(
        (schedule) =>
          `${decodeDayMask(schedule.day_of_week_mask).join("/")} ${schedule.start_time}-${schedule.end_time}`,
      )
      .join(" | ");
  }, [student.active_schedules]);

  if (mode === "teacher") {
    return (
      <>
        <SectionCard title="Profile" icon={<PersonIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.4rem" }}>
              {student.initials}
            </Avatar>
            <Box>
              <Typography variant="h5">{student.initials}</Typography>
              <Typography variant="body2" color="text.secondary">
                Age {calculateAge(student.dob)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
            Read-Only Schedule
          </Typography>
          <Typography>{scheduleSummary}</Typography>

          {student.active_schedules && student.active_schedules.length > 0 && (
            <List dense sx={{ mt: 1, p: 0 }}>
              {student.active_schedules.map((schedule) => (
                <ListItem key={schedule.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={`${decodeDayMask(schedule.day_of_week_mask).join("/")} ${schedule.start_time} - ${schedule.end_time}`}
                    secondary={`${schedule.site.name} with ${schedule.teacher.name}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
            <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
            Siblings
          </Typography>
          {student.siblings.length > 0 ? (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {student.siblings.map((sibling) => (
                <Chip key={sibling.id} label={sibling.name} />
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No siblings recorded.</Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Guardian Summary
            </Typography>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => {
                setGuardianSummaryDraft(student.guardian_summary || "");
                setGuardianSummaryEditOpen(true);
              }}
            >
              Edit
            </Button>
          </Box>
          <Typography>
            {student.guardian_summary?.trim()
              ? student.guardian_summary
              : "No guardian summary recorded."}
          </Typography>
        </SectionCard>

        <Dialog
          open={guardianSummaryEditOpen}
          onClose={() => setGuardianSummaryEditOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Guardian Summary</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              rows={5}
              fullWidth
              value={guardianSummaryDraft}
              onChange={(event) =>
                setGuardianSummaryDraft((event.target as unknown as { value: string }).value)
              }
              placeholder="Add relevant guardian/family context for staff"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setGuardianSummaryEditOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => updateGuardianSummaryMutation.mutate(guardianSummaryDraft)}
              disabled={updateGuardianSummaryMutation.isPending}
            >
              {updateGuardianSummaryMutation.isPending ? <CircularProgress size={20} /> : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <SectionCard>
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
        <Avatar
          src={student.photo_url || undefined}
          sx={{
            width: 80,
            height: 80,
            bgcolor: "primary.main",
            fontSize: "1.75rem",
          }}
        >
          {student.initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">
            {student.first_name} {student.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Initials: {student.initials}
          </Typography>
          <Chip
            label={student.is_active ? "Active" : "Inactive"}
            color={student.is_active ? "success" : "default"}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
        {onEdit && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Date of Birth
          </Typography>
          <Typography>
            {formatDate(student.dob)} (Age: {calculateAge(student.dob)})
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
            Site
          </Typography>
          <Typography>
            {student.site?.name || "Not assigned"}{" "}
            {student.site?.type && (
              <Chip label={student.site.type.replace("_", " ")} size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>

        {student.current_school && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
              Current School
            </Typography>
            <Typography>{student.current_school}</Typography>
          </Box>
        )}

        {student.preferred_language && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Preferred Language
            </Typography>
            <Typography>{student.preferred_language}</Typography>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Hearing Devices
          </Typography>
          <Typography>
            {student.hearing_devices.length > 0
              ? student.hearing_devices.join(", ")
              : "Not specified"}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Hearing Loss Type
          </Typography>
          <Typography>{formatHearingLossType(student.hearing_loss_type)}</Typography>
        </Box>

        {student.guardian_summary && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Guardian Summary
            </Typography>
            <Typography>{student.guardian_summary}</Typography>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}
