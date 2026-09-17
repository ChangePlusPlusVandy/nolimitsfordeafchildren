"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, Button, Typography } from "@mui/material";
import PageContainer from "@/client/components/PageContainer";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message || "An unexpected error occurred while loading this page."}
          </Typography>
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => reset()}>
          Try again
        </Button>
      </Box>
    </PageContainer>
  );
}
