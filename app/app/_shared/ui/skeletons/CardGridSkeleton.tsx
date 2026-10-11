import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

interface CardGridSkeletonProps {
  count?: number;
  cardHeight?: number;
  showAvatar?: boolean;
}

export default function CardGridSkeleton({
  count = 6,
  cardHeight,
  showAvatar = true,
}: CardGridSkeletonProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {Array.from({ length: count }, (_, i) => i).map((i) => (
        <Box
          key={`skeleton-${i}`}
          sx={{
            flex: "1 1 300px",
            maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.33% - 16px)" },
          }}
        >
          <Card sx={{ height: cardHeight }}>
            <CardContent>
              <Stack spacing={2}>
                {showAvatar && (
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Stack>
                )}
                <Skeleton variant="text" />
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="rounded" width={120} height={24} />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}
