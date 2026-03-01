import { Box, Skeleton, Stack } from "@mui/material";

interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  avatarSize?: number;
}

export default function ListSkeleton({
  count = 3,
  showAvatar = true,
  avatarSize = 40,
}: ListSkeletonProps) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Stack key={i} direction="row" spacing={2} alignItems="center">
          {showAvatar && <Skeleton variant="circular" width={avatarSize} height={avatarSize} />}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
