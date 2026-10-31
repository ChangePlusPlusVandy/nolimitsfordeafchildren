"use client";

import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";

import type { HearingInfoInput } from "./actions";

const HEARING_DEVICE_OPTIONS = ["BAHA", "Hearing Aid", "Cochlear Implant", "Other"];
const HEARING_LOSS_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "moderately_severe", label: "Moderately Severe" },
  { value: "severe", label: "Severe" },
  { value: "profound", label: "Profound" },
  { value: "unknown", label: "Unknown" },
];

interface EditHearingInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HearingInfoInput) => void;
  initialDevices: string[];
  initialLossType: HearingInfoInput["hearing_loss_type"];
  isLoading?: boolean;
}

export default function EditHearingInfoModal({
  open,
  onClose,
  onSave,
  initialDevices,
  initialLossType,
  isLoading = false,
}: EditHearingInfoModalProps) {
  const [hearingDevices, setHearingDevices] = useState<string[]>(initialDevices);
  const [hearingLossType, setHearingLossType] = useState<string>(initialLossType ?? "");

  useEffect(() => {
    if (open) {
      setHearingDevices(initialDevices);
      setHearingLossType(initialLossType ?? "");
    }
  }, [open, initialDevices, initialLossType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      hearing_devices: hearingDevices,
      hearing_loss_type: (hearingLossType || null) as HearingInfoInput["hearing_loss_type"],
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Hearing Information</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Hearing Devices</InputLabel>
              <Select
                multiple
                value={hearingDevices}
                label="Hearing Devices"
                onChange={(e) => setHearingDevices(e.target.value as string[])}
                renderValue={(selected) =>
                  (selected as string[]).length > 0
                    ? (selected as string[]).join(", ")
                    : "None selected"
                }
              >
                {HEARING_DEVICE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox checked={hearingDevices.includes(option)} />
                    <ListItemText primary={option} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Hearing Loss Type</InputLabel>
              <Select
                value={hearingLossType}
                label="Hearing Loss Type"
                onChange={(e) => setHearingLossType(e.target.value)}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {HEARING_LOSS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
