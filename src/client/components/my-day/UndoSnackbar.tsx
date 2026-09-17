import { Undo as UndoIcon } from "@mui/icons-material";
import { IconButton, Snackbar } from "@mui/material";
import type { AttendanceStatus } from "@/client/attendance";
import type { SessionForDay } from "@/client/teachers";

interface UndoSnackbarProps {
  open: boolean;
  session: SessionForDay | null;
  onClose: () => void;
  onUndo: () => void;
}

export default function UndoSnackbar({ open, session, onClose, onUndo }: UndoSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      message={`Marked ${session?.student_first_name} ${session?.student_last_name}`}
      action={
        <IconButton
          size="small"
          color="inherit"
          onClick={onUndo}
          aria-label="Undo attendance marking"
        >
          <UndoIcon fontSize="small" />
        </IconButton>
      }
    />
  );
}

export type UndoSnackbarState = {
  open: boolean;
  session: SessionForDay | null;
  previousStatus: AttendanceStatus | null;
  previousLateMinutes: number | null;
  previousSiblingIds: string[];
};

export const EMPTY_UNDO_STATE: UndoSnackbarState = {
  open: false,
  session: null,
  previousStatus: null,
  previousLateMinutes: null,
  previousSiblingIds: [],
};
