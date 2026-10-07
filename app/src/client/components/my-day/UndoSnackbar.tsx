import { Undo as UndoIcon } from "@mui/icons-material";
import { IconButton, Snackbar } from "@mui/material";

import type { AttendanceStatus } from "@/client/attendance";
import type { SessionForDay } from "@/client/teachers";

export enum UndoAvailability {
  Ready = "ready",
  Pending = "pending",
}

interface UndoSnackbarProps {
  open: boolean;
  availability: UndoAvailability;
  session: SessionForDay | null;
  onClose: () => void;
  onUndo: () => void;
}

export default function UndoSnackbar({
  open,
  availability,
  session,
  onClose,
  onUndo,
}: UndoSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      message={session ? `Marked ${session.student_initials}` : ""}
      action={
        <IconButton
          size="small"
          color="inherit"
          onClick={onUndo}
          disabled={availability === UndoAvailability.Pending}
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
