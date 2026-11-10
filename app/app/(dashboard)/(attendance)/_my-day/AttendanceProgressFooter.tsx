import { Box, Chip, Paper, Typography } from "@mui/material";

interface AttendanceProgressFooterProps {
  markedCount: number;
  totalCount: number;
}

export default function AttendanceProgressFooter({
  markedCount,
  totalCount,
}: AttendanceProgressFooterProps) {
  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          zIndex: 1000,
        }}
        elevation={3}
      >
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Typography variant="body1">
            <strong>{markedCount}</strong> of <strong>{totalCount}</strong> marked
          </Typography>
          {markedCount === totalCount && totalCount > 0 && (
            <Chip label="All Done!" color="success" size="small" />
          )}
        </Box>
      </Paper>
      <Box sx={{ height: 80 }} />
    </>
  );
}
