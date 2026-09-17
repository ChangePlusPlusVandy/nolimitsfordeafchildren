"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/client/components/ToastProvider";
import { createMakeupRequest } from "@/client/makeups";
import { formatDateLong } from "@/client/utils/formatDate";

type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

interface MissedSession {
  schedule_id: string;
  date: string;
  reason: string | null;
}

interface RequestMakeupModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  missedSession: MissedSession | null;
}

const REASON_OPTIONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Child was sick" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "transportation", label: "Transportation issues" },
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "no_show_unknown", label: "Unable to attend (other)" },
  { value: "other", label: "Other" },
];

export default function RequestMakeupModal({
  open,
  onClose,
  studentId,
  missedSession,
}: RequestMakeupModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [reason, setReason] = useState<AbsenceReason>("sick");
  const [reasonText, setReasonText] = useState("");
  const [preferredDates, setPreferredDates] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!missedSession) throw new Error("No session selected");

      return createMakeupRequest({
        student_id: studentId,
        original_session_date: missedSession.date,
        original_schedule_id: missedSession.schedule_id,
        reason,
        reason_text: reasonText || undefined,
        preferred_dates: preferredDates || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["parent-makeup-requests"] });
      toast.success("Make-up request submitted successfully");
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit request");
    },
  });

  const handleClose = () => {
    setReason("sick");
    setReasonText("");
    setPreferredDates("");
    onClose();
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Make-Up Class</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {missedSession && (
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Missed Session
              </Typography>
              <Typography variant="body1">{formatDateLong(missedSession.date)}</Typography>
            </Box>
          )}

          <TextField
            select
            label="Reason for Absence"
            value={reason}
            onChange={(e) => setReason(e.target.value as AbsenceReason)}
            fullWidth
            required
          >
            {REASON_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {(reason === "other" || reason === "family_emergency") && (
            <TextField
              label="Please explain"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              multiline
              rows={2}
              fullWidth
              required={reason === "other"}
            />
          )}

          <TextField
            label="Preferred Make-Up Dates (optional)"
            value={preferredDates}
            onChange={(e) => setPreferredDates(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="e.g., Any Saturday in March, or weekday afternoons"
            helperText="Let us know when you're available for a make-up session"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isPending || (reason === "other" && !reasonText.trim())}
        >
          {createMutation.isPending ? <CircularProgress size={20} /> : "Submit Request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
