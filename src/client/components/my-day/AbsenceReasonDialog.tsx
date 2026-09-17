import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { AbsenceReason, AttendanceStatus } from "@/client/attendance";
import type { SessionForDay } from "@/client/teachers";
import { ABSENCE_REASONS } from "./constants";

interface AbsenceReasonDialogProps {
  open: boolean;
  selectedSession: SessionForDay | null;
  selectedStatus: AttendanceStatus | null;
  selectedReason: AbsenceReason | "";
  reasonText: string;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (event: SelectChangeEvent<string>) => void;
  onReasonTextChange: (value: string) => void;
}

export default function AbsenceReasonDialog({
  open,
  selectedSession,
  selectedStatus,
  selectedReason,
  reasonText,
  onClose,
  onConfirm,
  onReasonChange,
  onReasonTextChange,
}: AbsenceReasonDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
            <Select value={selectedReason} label="Reason" onChange={onReasonChange}>
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
              onChange={(event) => onReasonTextChange(event.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={selectedStatus === "no_show" ? "error" : "inherit"}
          disabled={!selectedReason || (selectedReason === "other" && !reasonText)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
