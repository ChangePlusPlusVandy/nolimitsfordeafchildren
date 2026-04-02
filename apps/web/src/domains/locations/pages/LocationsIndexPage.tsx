import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Paper,
  Skeleton,
  TablePagination,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import {
  useLocationHttpService,
  type LocationMapPin,
  type LocationType,
} from "../services/LocationHttpService";
import { useServerTable } from "../../global/hooks/useServerTable";
import { useAuth } from "../../../auth";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

const createMarkerIcon = (isActive: boolean) => {
  const color = isActive ? "#22c55e" : "#ef4444";
  return divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

function FitBoundsToMarkers({ pins }: { pins: Array<{ latitude: string; longitude: string }> }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = new LatLngBounds(
      pins.map((pin) => [parseFloat(pin.latitude), parseFloat(pin.longitude)] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pins]);

  return null;
}

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  education_center: "Education Center",
  pop_up: "Pop-up",
  remote: "Remote",
};

export default function LocationsIndexPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const locationHttpService = useLocationHttpService();
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
    queryKey: [locationHttpService.key, "list", table.queryParams],
    queryFn: () =>
      locationHttpService.queries.list({
        page: table.page,
        limit: table.limit,
        sort: "name",
        order: "asc",
        ...(table.debouncedSearch ? { search: table.debouncedSearch } : {}),
      }),
  });

  const { data: mapPins, isLoading: mapLoading } = useQuery({
    queryKey: [locationHttpService.key, "mapData"],
    queryFn: locationHttpService.queries.mapData,
  });

  const validMapPins = (mapPins ?? []).filter(
    (pin): pin is LocationMapPin & { latitude: string; longitude: string } =>
      pin.latitude !== null && pin.longitude !== null,
  );

  const mapCenter: [number, number] =
    validMapPins.length > 0
      ? [
          validMapPins.reduce((sum, pin) => sum + parseFloat(pin.latitude), 0) / validMapPins.length,
          validMapPins.reduce((sum, pin) => sum + parseFloat(pin.longitude), 0) / validMapPins.length,
        ]
      : [39.8283, -98.5795];

  const handleLocationClick = (id: string) => {
    navigate(`/locations/${id}`);
  };

  if (locationsLoading) {
    return (
      <PageContainer>
        <PageHeader title="Locations" />
        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Skeleton variant="rectangular" height={350} animation="pulse" />
        </Paper>
        <SectionCard>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="stretch">
            <TextField
              value={table.search}
              onChange={(event) => table.setSearch(event.target.value)}
              placeholder="Search locations..."
              size="small"
              sx={{ minWidth: { sm: 220 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/locations/new")}
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
            <MapContainer center={mapCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {validMapPins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={[parseFloat(pin.latitude), parseFloat(pin.longitude)]}
                  icon={createMarkerIcon(pin.is_active)}
                  eventHandlers={{ click: () => handleLocationClick(pin.id) }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {pin.name}
                      </Typography>
                      <Chip
                        label={LOCATION_TYPE_LABEL[pin.type]}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, mb: 0.5 }}
                      />
                      <br />
                      <Chip
                        label={pin.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={pin.is_active ? "success" : "default"}
                        variant={pin.is_active ? "filled" : "outlined"}
                      />
                    </Box>
                  </Popup>
                </Marker>
              ))}
              <FitBoundsToMarkers pins={validMapPins} />
            </MapContainer>
          )}
        </Box>
      </Paper>

      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: "#22c55e", border: "2px solid white", boxShadow: 1 }} />
          <Typography variant="body2">Active</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: "#ef4444", border: "2px solid white", boxShadow: 1 }} />
          <Typography variant="body2">Inactive</Typography>
        </Stack>
      </Stack>

      {/* Locations List */}
      <SectionCard
        title={`All Locations (${locationsData?.total ?? 0})`}
        noPadding
      >
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
                    <Chip label={LOCATION_TYPE_LABEL[location.type]} size="small" variant="outlined" />
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
