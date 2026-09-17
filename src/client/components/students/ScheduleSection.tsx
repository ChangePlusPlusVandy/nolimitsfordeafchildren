"use client";

import ScheduleIcon from "@mui/icons-material/Schedule";
import { Box, Chip, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import SectionCard from "@/client/components/SectionCard";
import { decodeDayMask } from "@/client/components/students/studentDetailUtils";
import type { StudentDetails } from "@/client/students";
import { formatDate, formatTime } from "@/client/utils/formatDate";

interface ScheduleSectionProps {
  student: StudentDetails;
}

export default function ScheduleSection({ student }: ScheduleSectionProps) {
  return (
    <SectionCard title="Schedule History" icon={<ScheduleIcon />}>
      {(student.schedule_history?.length || 0) > 0 ? (
        <List dense sx={{ p: 0 }}>
          {student.schedule_history?.map((entry, index) => (
            <Box key={entry.enrollment_id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="body1" component="span">
                        {decodeDayMask(entry.schedule.day_of_week_mask).join("/")} at{" "}
                        {formatTime(entry.schedule.start_time)}
                      </Typography>
                      {entry.is_current && <Chip size="small" label="Current" color="primary" />}
                      {entry.schedule.session?.name && (
                        <Chip size="small" label={entry.schedule.session.name} variant="outlined" />
                      )}
                    </Box>
                  }
                  slotProps={{ primary: { component: "div" } }}
                  secondary={
                    <>
                      {entry.schedule.site.name} with {entry.schedule.teacher.name}
                      <br />
                      Cycle: {formatDate(entry.schedule.cycle_start_date)} to{" "}
                      {formatDate(entry.schedule.cycle_end_date)}
                      <br />
                      Enrollment: {formatDate(entry.enrolled_at)}
                      {entry.ended_at ? ` to ${formatDate(entry.ended_at)}` : " to present"}
                    </>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">No schedule history recorded.</Typography>
      )}
    </SectionCard>
  );
}
