"use client";

import AddIcon from "@mui/icons-material/Add";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/client/auth";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useServerTable } from "@/client/hooks/useServerTable";
import { getMapData, type LocationMapPin, listLocations } from "@/client/locations";

// Leaflet requires `window`, so the map is loaded client-side only.
const SiteMap = dynamic(() => import("@/client/components/locations/SiteMap"), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height="100%" animation="pulse" />,
});

const LOCATION_TYPE_LABEL: Record<LocationMapPin["type"], string> = {
  education_center: "Education Center",
  pop_up: "Pop-up",
  remote: "Remote",
};

function LocationsIndexPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const table = useServerTable({
    defaultLimit: 20,
    defaultSort: "name",
    defaultOrder: "asc",
  });

  const {
    data: locationsData,
    isLoading: locationsLoading,
    error: locationsError,
    refetch,
  } = useQuery({
    queryKey: ["locations", "list", table.queryParams],
    queryFn: () =>
      listLocations({
        page: table.page,
        limit: table.limit,
        sort: "name",
        order: "asc",
        ...(table.debouncedSearch ? { search: table.debouncedSearch } : {}),
      }),
  });

  const { data: mapPins, isLoading: mapLoading } = useQuery({
    queryKey: ["locations", "mapData"],
    queryFn: () => getMapData(),
  });

  const validMapPins = (mapPins ?? []).filter(
    (pin): pin is LocationMapPin & { latitude: string; longitude: string } =>
      pin.latitude !== null && pin.longitude !== null,
  );

  const handleLocationClick = (id: string) => {
    router.push(`/locations/${id}`);
  };

  if (locationsLoading) {
    return (
      <PageContainer>
        <PageHeader title="Locations" />
        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Skeleton variant="rectangular" height={350} animation="pulse" />
        </Paper>
        <SectionCard>
          {Array.from({ length: 5 }, (_, i) => i).map((i) => (
            <Box
              key={`skeleton-${i}`}
              sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="25%" />
              </Box>
              <Skeleton variant="rounded" width={100} height={24} />
            </Box>
          ))}
        </SectionCard>
      </PageContainer>
    );
  }

  if (locationsError) {
    return (
      <PageContainer>
        <PageHeader title="Locations" />
        <ErrorAlert message="Failed to load locations." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const locations = locationsData?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Locations"
        actions={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: "stretch" }}
          >
            <TextField
              value={table.search}
              onChange={(event) => table.setSearch(event.target.value)}
              placeholder="Search locations..."
              size="small"
              sx={{ minWidth: { sm: 220 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push("/locations/new")}
              >
                Add Location
              </Button>
            )}
          </Stack>
        }
      />

      {/* Map Section */}
      <Paper sx={{ mb: 3, overflow: "hidden" }}>
        <Box sx={{ height: { xs: 250, sm: 350, md: 400 }, width: "100%" }}>
          {mapLoading ? (
            <Skeleton variant="rectangular" height="100%" animation="pulse" />
          ) : (
            <SiteMap pins={validMapPins} onLocationClick={handleLocationClick} />
          )}
        </Box>
      </Paper>

      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: "success.main",
              border: "2px solid white",
              boxShadow: 1,
            }}
          />
          <Typography variant="body2">Active</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: "error.main",
              border: "2px solid white",
              boxShadow: 1,
            }}
          />
          <Typography variant="body2">Inactive</Typography>
        </Stack>
      </Stack>

      {/* Locations List */}
      <SectionCard title={`All Locations (${locationsData?.total ?? 0})`} noPadding>
        {locations.length === 0 ? (
          <EmptyState
            icon={<LocationOnIcon sx={{ fontSize: 48 }} />}
            title="No locations found"
            description={isAdmin ? "Click 'Add Location' to create one." : undefined}
          />
        ) : (
          <List disablePadding>
            {locations.map((location, index) => (
              <ListItem key={location.id} disablePadding divider={index < locations.length - 1}>
                <ListItemButton onClick={() => handleLocationClick(location.id)}>
                  <LocationOnIcon
                    sx={{ mr: 2, color: location.is_active ? "success.main" : "error.main" }}
                  />
                  <ListItemText
                    primary={location.name}
                    secondary={`${location.city}, ${location.state}`}
                  />
                  <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
                    <Chip
                      label={LOCATION_TYPE_LABEL[location.type]}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={location.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={location.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={locationsData?.total ?? 0}
          rowsPerPage={table.limit}
          page={Math.max(table.page - 1, 0)}
          onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
        />
      </SectionCard>
    </PageContainer>
  );
}

export default function LocationsPage() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={350} animation="pulse" />}>
      <LocationsIndexPage />
    </Suspense>
  );
}
