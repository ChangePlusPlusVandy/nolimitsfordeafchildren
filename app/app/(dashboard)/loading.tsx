import { Box, CircularProgress } from "@mui/material";

import PageContainer from "@/client/components/PageContainer";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 240,
        }}
      >
        <CircularProgress aria-label="Loading page" />
      </Box>
    </PageContainer>
  );
}
