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
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AssessmentFocus } from "@/client/assessments";

export const TEACHING_FOCUS_OPTIONS = [
  "Articulation",
  "Vocabulary",
  "Listening Skills",
  "Speech Comprehension",
  "Language Development",
  "Auditory Memory",
  "Phonological Awareness",
  "Reading Skills",
  "Other",
];

interface AssessmentFormDialogProps {
  open: boolean;
  mode: "create" | "edit" | "clone";
  cycleStartDate: string;
  assessmentType: "pre" | "post";
  teachingFocus: string;
  score: number;
  notes: string;
  focuses: AssessmentFocus[];
  isSaving: boolean;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
  onCycleStartDateChange: (value: string) => void;
  onAssessmentTypeChange: (value: "pre" | "post") => void;
  onTeachingFocusChange: (value: string) => void;
  onScoreChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  onFocusesChange: (focuses: AssessmentFocus[]) => void;
}

export default function AssessmentFormDialog({
  open,
  mode,
  cycleStartDate,
  assessmentType,
  teachingFocus,
  score,
  notes,
  focuses,
  isSaving,
  canSave,
  onClose,
  onSave,
  onCycleStartDateChange,
  onAssessmentTypeChange,
  onTeachingFocusChange,
  onScoreChange,
  onNotesChange,
  onFocusesChange,
}: AssessmentFormDialogProps) {
  const title =
    mode === "edit" ? "Edit Assessment" : mode === "clone" ? "Clone Assessment" : "Add Assessment";

  const saveLabel = mode === "edit" ? "Update" : mode === "clone" ? "Clone" : "Save";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Cycle Start Date"
            type="date"
            value={cycleStartDate}
            onChange={(e) =>
              onCycleStartDateChange((e.target as unknown as { value: string }).value)
            }
            disabled={mode === "edit"}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          <TextField
            select
            label="Assessment Type"
            value={assessmentType}
            onChange={(e) =>
              onAssessmentTypeChange((e.target as unknown as { value: "pre" | "post" }).value)
            }
            disabled={mode === "edit"}
            fullWidth
          >
            <MenuItem value="pre">Pre-Assessment</MenuItem>
            <MenuItem value="post">Post-Assessment</MenuItem>
          </TextField>

          <TextField
            select
            label="Legacy Focus Summary"
            value={teachingFocus}
            onChange={(e) =>
              onTeachingFocusChange((e.target as unknown as { value: string }).value)
            }
            fullWidth
            helperText="Auto-generated from focus goals below when goals are provided"
          >
            {TEACHING_FOCUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Teaching Focuses (up to 4)</Typography>
            {focuses.map((focus, index) => (
              <Box
                // biome-ignore lint/suspicious/noArrayIndexKey: editable focus rows are keyed by position
                key={`focus-${index}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: 1,
                }}
              >
                <TextField
                  label={`Goal ${index + 1}`}
                  value={focus.goal}
                  onChange={(e) => {
                    const next = [...focuses];
                    const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                    next[index] = {
                      ...current,
                      goal: (e.target as unknown as { value: string }).value,
                    };
                    onFocusesChange(next);
                  }}
                  fullWidth
                />
                <TextField
                  type="number"
                  label="Score"
                  value={focus.score}
                  onChange={(e) => {
                    const next = [...focuses];
                    const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                    next[index] = {
                      ...current,
                      score: Number((e.target as unknown as { value: string }).value),
                    };
                    onFocusesChange(next);
                  }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <TextField
                  type="number"
                  label="Max"
                  value={focus.max_score}
                  onChange={(e) => {
                    const next = [...focuses];
                    const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                    next[index] = {
                      ...current,
                      max_score: Number((e.target as unknown as { value: string }).value),
                    };
                    onFocusesChange(next);
                  }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
                <Button
                  color="error"
                  onClick={() => {
                    if (focuses.length === 1) {
                      onFocusesChange([{ goal: "", score: 0, max_score: 10 }]);
                      return;
                    }
                    onFocusesChange(focuses.filter((_, focusIndex) => focusIndex !== index));
                  }}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box>
              <Button
                size="small"
                onClick={() => {
                  if (focuses.length >= 4) return;
                  onFocusesChange([...focuses, { goal: "", score: 0, max_score: 10 }]);
                }}
                disabled={focuses.length >= 4}
              >
                Add Focus
              </Button>
            </Box>
          </Stack>

          <Box>
            <Typography gutterBottom>Score: {score}/20</Typography>
            <Slider
              value={score}
              onChange={(_, value) => onScoreChange(value as number)}
              min={0}
              max={20}
              step={1}
              marks={[
                { value: 0, label: "0" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 20, label: "20" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => onNotesChange((e.target as unknown as { value: string }).value)}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!canSave || isSaving}>
          {isSaving ? <CircularProgress size={20} /> : saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
