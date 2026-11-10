import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

interface SiblingOption {
  id: string;
  name: string;
  relationship: string;
}

interface SiblingParticipantsDialogProps {
  open: boolean;
  siblingOptions: SiblingOption[];
  siblingDialogSelection: string[];
  onClose: () => void;
  onSave: () => void;
  onToggleSibling: (siblingId: string) => void;
}

export default function SiblingParticipantsDialog({
  open,
  siblingOptions,
  siblingDialogSelection,
  onClose,
  onSave,
  onToggleSibling,
}: SiblingParticipantsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sibling Participants</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {siblingOptions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No participant siblings available for this student.
            </Typography>
          ) : (
            siblingOptions.map((sibling) => {
              const selected = siblingDialogSelection.includes(sibling.id);
              return (
                <Button
                  key={sibling.id}
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => onToggleSibling(sibling.id)}
                  sx={{ justifyContent: "space-between" }}
                >
                  {sibling.name}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {sibling.relationship}
                  </Typography>
                </Button>
              );
            })
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
