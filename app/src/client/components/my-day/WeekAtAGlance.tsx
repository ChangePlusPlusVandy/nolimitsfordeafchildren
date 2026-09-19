import { Chip, Stack, Typography } from "@mui/material";

import SectionCard from "@/client/components/SectionCard";
import { formatDateOnlyWeekdayShort } from "@/client/utils/date";

interface WeekAtAGlanceProps {
  sortedSessionDates: string[];
  sessionsByDay: Record<string, number>;
  markedByDay: Record<string, number>;
}

export default function WeekAtAGlance({
  sortedSessionDates,
  sessionsByDay,
  markedByDay,
}: WeekAtAGlanceProps) {
  return (
    <SectionCard>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Week At A Glance
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap" }}
      >
        {sortedSessionDates.map((date) => {
          const totalForDay = sessionsByDay[date] ?? 0;
          const markedForDay = markedByDay[date] ?? 0;

          return (
            <Chip
              key={date}
              label={`${formatDateOnlyWeekdayShort(date)}: ${markedForDay}/${totalForDay} marked`}
              color={markedForDay === totalForDay ? "success" : "default"}
              variant={markedForDay === totalForDay ? "filled" : "outlined"}
            />
          );
        })}
      </Stack>
    </SectionCard>
  );
}
