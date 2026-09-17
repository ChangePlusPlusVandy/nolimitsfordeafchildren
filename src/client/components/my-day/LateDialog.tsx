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
  Typography,
} from "@mui/material";
import type { SessionForDay } from "@/client/teachers";

interface LateDialogProps {
  open: boolean;
  selectedSession: SessionForDay | null;
  selectedLateMinutes: number;
  onClose: () => void;
  onConfirm: () => void;
  onLateMinutesChange: (minutes: number) => void;
}

export default function LateDialog({
  open,
  selectedSession,
  selectedLateMinutes,
  onClose,
  onConfirm,
  onLateMinutesChange,
}: LateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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
                onLateMinutesChange(Number((event.target as unknown as { value: string }).value))
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
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={onConfirm}>
          Confirm Late
        </Button>
      </DialogActions>
    </Dialog>
  );
}
