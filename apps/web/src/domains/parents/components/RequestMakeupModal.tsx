import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material"
import { useHttpClient } from "../../../plugins/axios"
import { useToast } from "../../global/components/ToastProvider"

type AbsenceReason = "sick" | "family_emergency" | "transportation" | "schedule_conflict" | "no_show_unknown" | "other"

interface MissedSession {
  schedule_id: string
  date: string
  reason: string | null
}

interface RequestMakeupModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  missedSession: MissedSession | null
}

const REASON_OPTIONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Child was sick" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "transportation", label: "Transportation issues" },
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "no_show_unknown", label: "Unable to attend (other)" },
  { value: "other", label: "Other" },
]

export default function RequestMakeupModal({
  open,
  onClose,
  studentId,
  missedSession,
}: RequestMakeupModalProps) {
  const httpClient = useHttpClient()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [reason, setReason] = useState<AbsenceReason>("sick")
  const [reasonText, setReasonText] = useState("")
  const [preferredDates, setPreferredDates] = useState("")

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!missedSession) throw new Error("No session selected")
      
      const response = await httpClient.post("/v1/makeup-requests", {
        student_id: studentId,
        original_session_date: missedSession.date,
        original_schedule_id: missedSession.schedule_id,
        reason,
        reason_text: reasonText || undefined,
        preferred_dates: preferredDates || undefined,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parentHttp"] })
      queryClient.invalidateQueries({ queryKey: ["parent-makeup-requests"] })
      toast.success("Make-up request submitted successfully")
      handleClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to submit request")
    },
  })

  const handleClose = () => {
    setReason("sick")
    setReasonText("")
    setPreferredDates("")
    onClose()
  }

  const handleSubmit = () => {
    createMutation.mutate()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Make-Up Class</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {missedSession && (
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Missed Session
              </Typography>
              <Typography variant="body1">{formatDate(missedSession.date)}</Typography>
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
        </Box>
      </DialogContent>
      <DialogActions>
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
  )
}
