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
import type { SiteOption } from "./types";

interface SickDayDialogProps {
  open: boolean;
  selectedDate: string;
  sickDaySiteId: string;
  sickDayNote: string;
  siteOptions: SiteOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onSiteChange: (siteId: string) => void;
  onNoteChange: (note: string) => void;
}

export default function SickDayDialog({
  open,
  selectedDate,
  sickDaySiteId,
  sickDayNote,
  siteOptions,
  isSubmitting,
  onClose,
  onSubmit,
  onSiteChange,
  onNoteChange,
}: SickDayDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
              onChange={(event) => onSiteChange(event.target.value)}
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
            onChange={(event) => onNoteChange(event.target.value)}
            multiline
            minRows={3}
            placeholder="Today's sessions are impacted due to illness..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Notice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
