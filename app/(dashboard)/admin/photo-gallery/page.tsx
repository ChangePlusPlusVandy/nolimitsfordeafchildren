"use client";

import { PhotoLibrary as PhotoLibraryIcon } from "@mui/icons-material";
import {
  Box,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import CardGridSkeleton from "@/client/components/skeletons/CardGridSkeleton";
import { useServerTable } from "@/client/hooks/useServerTable";
import { listAllLocations } from "@/client/locations";
import { listPhotos } from "@/client/sessions";
import { formatDate } from "@/client/utils/formatDate";

interface GalleryPhoto {
  id: string;
  session_date: string;
  caption: string | null;
  file_url: string;
  file_name: string;
  location: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    initials: string;
  } | null;
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

function PhotoGalleryPage() {
  const table = useServerTable({ defaultLimit: 18 });
  const locationFilter = table.getFilter("location_id");
  const dateFilter = table.getFilter("session_date");

  const { data: locationOptions = [] } = useQuery({
    queryKey: ["locations", "all", "photo-gallery-filter"],
    queryFn: () => listAllLocations(),
  });

  const { data, isLoading, error, refetch } = useQuery<{
    items: GalleryPhoto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["admin-photo-gallery", table.queryParams],
    queryFn: () =>
      listPhotos({
        page: table.page,
        limit: table.limit,
        ...(locationFilter ? { location_id: locationFilter } : {}),
        ...(dateFilter ? { session_date: dateFilter } : {}),
      }),
  });

  const photos = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader title="Photo Gallery" />

      <Stack spacing={3}>
        {/* Filters */}
        <SectionCard>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Filter by location</InputLabel>
              <Select
                label="Filter by location"
                value={locationFilter}
                onChange={(event) => table.setFilter("location_id", event.target.value)}
              >
                <MenuItem value="">All locations</MenuItem>
                {locationOptions.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Filter by session date"
              type="date"
              value={dateFilter}
              onChange={(event) => table.setFilter("session_date", event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
        </SectionCard>

        {/* Content */}
        {isLoading ? (
          <CardGridSkeleton />
        ) : error ? (
          <ErrorAlert message="Failed to load photo gallery." onRetry={() => refetch()} />
        ) : photos.length === 0 ? (
          <SectionCard>
            <EmptyState
              icon={<PhotoLibraryIcon sx={{ fontSize: 48 }} />}
              title="No Photos Found"
              description="No photos found for the current filters."
            />
          </SectionCard>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              {photos.map((photo) => (
                <SectionCard key={photo.id} noPadding>
                  <Box
                    component="img"
                    src={photo.file_url}
                    alt={photo.caption || photo.file_name}
                    sx={{ width: "100%", height: 190, objectFit: "cover" }}
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {photo.location.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {formatDate(photo.session_date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {photo.student ? `Student ${photo.student.initials}` : "Group photo"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Uploaded by {photo.uploaded_by_user.name}
                    </Typography>
                    {photo.caption && <Typography variant="body2">{photo.caption}</Typography>}
                  </CardContent>
                </SectionCard>
              ))}
            </Box>
            <TablePagination
              rowsPerPageOptions={[9, 18, 36]}
              component="div"
              count={data?.total ?? 0}
              rowsPerPage={table.limit}
              page={Math.max(table.page - 1, 0)}
              onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
              onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
            />
          </>
        )}
      </Stack>
    </PageContainer>
  );
}

export default function PhotoGalleryPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <PhotoGalleryPage />
    </Suspense>
  );
}
