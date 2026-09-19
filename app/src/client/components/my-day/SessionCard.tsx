import { Block as BlockIcon, Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";

import type { AttendanceStatus } from "@/client/attendance";
import type { SessionForDay } from "@/client/teachers";
import { formatTime } from "@/client/utils/formatDate";

import { ABSENCE_REASONS, getStatusBorderColor, getStatusColor, getStatusLabel } from "./constants";

interface SessionCardProps {
  session: SessionForDay;
  isMarking: boolean;
  onStudentClick: (studentId: string) => void;
  onMarkAttendance: (session: SessionForDay, status: AttendanceStatus) => void;
  onOpenSiblingDialog: (session: SessionForDay) => void;
}

export default function SessionCard({
  session,
  isMarking,
  onStudentClick,
  onMarkAttendance,
  onOpenSiblingDialog,
}: SessionCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: session.attendance
          ? getStatusBorderColor(session.attendance.status)
          : "grey.300",
        borderWidth: session.attendance ? 2 : 1,
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              borderRadius: 1,
              p: 0.5,
              m: -0.5,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            onClick={() => onStudentClick(session.student_id)}
          >
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              {session.student_initials}
            </Avatar>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                {session.student_first_name} {session.student_last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTime(session.start_time)} - {formatTime(session.end_time)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }} />

          {session.attendance ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={getStatusLabel(session.attendance.status)}
                color={getStatusColor(session.attendance.status)}
                size="small"
              />
              {session.attendance.reason && (
                <Typography variant="caption" color="text.secondary">
                  ({ABSENCE_REASONS.find((r) => r.value === session.attendance?.reason)?.label})
                </Typography>
              )}
              {session.attendance.late_minutes && (
                <Typography variant="caption" color="text.secondary">
                  ({session.attendance.late_minutes} min late)
                </Typography>
              )}
              {session.attendance.sibling_participants &&
                session.attendance.sibling_participants.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Siblings:{" "}
                    {session.attendance.sibling_participants.map((sp) => sp.name).join(", ")}
                  </Typography>
                )}
              <Button size="small" onClick={() => onOpenSiblingDialog(session)}>
                Siblings
              </Button>
            </Box>
          ) : (
            <ButtonGroup variant="outlined" size="small">
              <Button
                color="success"
                onClick={() => onMarkAttendance(session, "present")}
                startIcon={<CheckIcon />}
                disabled={isMarking}
              >
                Present
              </Button>
              <Button
                color="inherit"
                onClick={() => onOpenSiblingDialog(session)}
                disabled={isMarking}
              >
                Siblings
              </Button>
              <Button
                color="warning"
                onClick={() => onMarkAttendance(session, "late")}
                disabled={isMarking}
              >
                Late
              </Button>
              <Button
                color="error"
                onClick={() => onMarkAttendance(session, "no_show")}
                startIcon={<CloseIcon />}
                disabled={isMarking}
              >
                No Show
              </Button>
              <Button
                color="inherit"
                onClick={() => onMarkAttendance(session, "cancelled")}
                startIcon={<BlockIcon />}
                disabled={isMarking}
              >
                Cancelled
              </Button>
            </ButtonGroup>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
