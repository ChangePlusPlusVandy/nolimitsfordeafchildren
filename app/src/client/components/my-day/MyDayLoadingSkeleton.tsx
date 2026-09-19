import { Box, Skeleton, Stack } from "@mui/material";

import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";

interface MyDayLoadingSkeletonProps {
  view: "day" | "week";
}

export default function MyDayLoadingSkeleton({ view }: MyDayLoadingSkeletonProps) {
  return (
    <PageContainer>
      <PageHeader title={view === "day" ? "My Day" : "My Week"} />
      <SectionCard>
        <Stack spacing={2}>
          {Array.from({ length: 4 }, (_, i) => i).map((i) => (
            <Stack key={`skeleton-${i}`} direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="25%" />
              </Box>
              <Skeleton
                variant="rounded"
                width={80}
                height={32}
                sx={{ display: { xs: "none", sm: "block" } }}
              />
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    </PageContainer>
  );
}
