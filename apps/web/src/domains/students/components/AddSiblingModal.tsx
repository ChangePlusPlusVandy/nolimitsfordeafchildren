import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import type { AddSiblingInput, Sibling } from "../services/StudentHttpService";

interface AddSiblingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddSiblingInput) => void;
  initialData?: Sibling | null;
  isLoading?: boolean;
  title?: string;
}

export default function AddSiblingModal({
  open,
  onClose,
  onSave,
  initialData,
  isLoading = false,
  title = "Add Sibling",
}: AddSiblingModalProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("brother");
  const [notes, setNotes] = useState("");

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setAge(initialData.age?.toString() || "");
        setRelationship(initialData.relationship);
        setNotes(initialData.notes || "");
      } else {
        setName("");
        setAge("");
        setRelationship("brother");
        setNotes("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship) return;

    onSave({
      name: name.trim(),
      age: age ? parseInt(age, 10) : undefined,
      relationship,
      notes: notes.trim() || undefined,
    });
  };

  const isValid = name.trim() && relationship;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="Sibling's name"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                fullWidth
                inputProps={{ min: 0, max: 99 }}
                placeholder="Age in years"
              />

              <FormControl fullWidth required>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={relationship}
                  label="Relationship"
                  onChange={(e) => setRelationship(e.target.value)}
                >
                  <MenuItem value="brother">Brother</MenuItem>
                  <MenuItem value="sister">Sister</MenuItem>
                  <MenuItem value="half-brother">Half-Brother</MenuItem>
                  <MenuItem value="half-sister">Half-Sister</MenuItem>
                  <MenuItem value="step-brother">Step-Brother</MenuItem>
                  <MenuItem value="step-sister">Step-Sister</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Any additional notes about this sibling"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {initialData ? "Save Changes" : "Add Sibling"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
