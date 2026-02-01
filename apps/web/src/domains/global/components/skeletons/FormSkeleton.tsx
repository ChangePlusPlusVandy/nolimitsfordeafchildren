import { Box, Paper, Skeleton, Stack } from "@mui/material";

interface FormSkeletonProps {
  fields?: number;
  showBackButton?: boolean;
  maxWidth?: number | string;
}

export default function FormSkeleton({
  fields = 5,
  showBackButton = true,
  maxWidth = 600,
}: FormSkeletonProps) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        {showBackButton && <Skeleton variant="rounded" width={80} height={36} />}
        <Skeleton variant="text" width={180} height={40} />
      </Box>

      <Paper sx={{ p: 3, maxWidth }}>
        <Stack spacing={3}>
          {/* Helper text */}
          <Skeleton variant="text" width="80%" />

          {/* Form fields */}
          {Array.from({ length: fields }).map((_, i) => (
            <Box key={i}>
              <Skeleton variant="text" width={100} height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" height={56} />
            </Box>
          ))}

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
            <Skeleton variant="rounded" width={80} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
