import { Box, Paper, Skeleton, Stack, Divider } from "@mui/material";

interface DetailPageSkeletonProps {
  showBackButton?: boolean;
  sections?: number;
}

export default function DetailPageSkeleton({
  showBackButton = true,
  sections = 3,
}: DetailPageSkeletonProps) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        {showBackButton && <Skeleton variant="rounded" width={80} height={36} />}
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ flex: 1 }} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Left Column - Profile */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
              <Skeleton variant="circular" width={80} height={80} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Details */}
            <Stack spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i}>
                  <Skeleton variant="text" width={100} height={16} />
                  <Skeleton variant="text" width="80%" />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Additional section */}
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Stack key={i} direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="30%" />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* Right Column - Sections */}
        <Box sx={{ flex: 1 }}>
          {Array.from({ length: sections }).map((_, i) => (
            <Paper key={i} sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Skeleton variant="text" width={150} height={28} />
                <Skeleton variant="rounded" width={100} height={32} />
              </Box>
              <Stack spacing={1}>
                {Array.from({ length: 2 }).map((_, j) => (
                  <Stack key={j} direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
