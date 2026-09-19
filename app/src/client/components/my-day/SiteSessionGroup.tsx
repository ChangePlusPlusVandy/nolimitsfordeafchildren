import { Box, Divider, Stack, Typography } from "@mui/material";

import type { AttendanceStatus } from "@/client/attendance";
import SectionCard from "@/client/components/SectionCard";
import type { SessionForDay } from "@/client/teachers";
import { formatDateOnlySiteHeader } from "@/client/utils/date";

import SessionCard from "./SessionCard";

interface SiteSessionGroupProps {
  sessionDate: string;
  siteName: string;
  sessions: SessionForDay[];
  isMarking: boolean;
  onStudentClick: (studentId: string) => void;
  onMarkAttendance: (session: SessionForDay, status: AttendanceStatus) => void;
  onOpenSiblingDialog: (session: SessionForDay) => void;
}

export default function SiteSessionGroup({
  sessionDate,
  siteName,
  sessions,
  isMarking,
  onStudentClick,
  onMarkAttendance,
  onOpenSiblingDialog,
}: SiteSessionGroupProps) {
  return (
    <SectionCard noPadding>
      <Box sx={{ px: 3, py: 2, bgcolor: "grey.100" }}>
        <Typography variant="subtitle2" color="text.secondary">
          {formatDateOnlySiteHeader(sessionDate)}
        </Typography>
        <Typography variant="h6">{siteName}</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {sessions.map((session) => (
            <SessionCard
              key={`${session.schedule_id}-${session.student_id}`}
              session={session}
              isMarking={isMarking}
              onStudentClick={onStudentClick}
              onMarkAttendance={onMarkAttendance}
              onOpenSiblingDialog={onOpenSiblingDialog}
            />
          ))}
        </Stack>
      </Box>
    </SectionCard>
  );
}
