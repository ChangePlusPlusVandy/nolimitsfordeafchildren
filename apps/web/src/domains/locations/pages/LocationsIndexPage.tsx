import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Alert,
  Paper,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useLocationHttpService, type LocationMapPin } from "../services/LocationHttpService";
import { useAuth } from "../../../auth";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom marker icons
const createMarkerIcon = (isActive: boolean) => {
  const color = isActive ? "#22c55e" : "#ef4444"; // green-500 / red-500
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

// Auto-fit map bounds to show all markers
function FitBoundsToMarkers({
  pins,
}: {
  pins: Array<{ latitude: string; longitude: string }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;

    const bounds = new LatLngBounds(
      pins.map((pin) => [parseFloat(pin.latitude), parseFloat(pin.longitude)] as [number, number])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pins]);

  return null;
}

export default function LocationsIndexPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const locationHttpService = useLocationHttpService();

  // Fetch all locations for the list
  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
  } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: locationHttpService.queries.index,
  });

  // Fetch map data (optimized for pins)
  const {
    data: mapPins,
    isLoading: mapLoading,
  } = useQuery({
    queryKey: [locationHttpService.key, "mapData"],
    queryFn: locationHttpService.queries.mapData,
  });

  // Filter pins with valid coordinates
  const validMapPins = (mapPins ?? []).filter(
    (pin): pin is LocationMapPin & { latitude: string; longitude: string } =>
      pin.latitude !== null && pin.longitude !== null
  );

  // Calculate map center (average of all pins, or default to US center)
  const mapCenter: [number, number] =
    validMapPins.length > 0
      ? [
          validMapPins.reduce((sum, pin) => sum + parseFloat(pin.latitude), 0) /
            validMapPins.length,
          validMapPins.reduce((sum, pin) => sum + parseFloat(pin.longitude), 0) /
            validMapPins.length,
        ]
      : [39.8283, -98.5795]; // Geographic center of US

  const handleLocationClick = (id: string) => {
    navigate(`/locations/${id}`);
  };

  if (locationsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Locations
          </Typography>
        </Box>
        {/* Map Skeleton */}
        <Paper elevation={2} sx={{ mb: 3, overflow: "hidden", borderRadius: 2 }}>
          <Skeleton variant="rectangular" height={400} animation="pulse" />
        </Paper>
        {/* List Skeleton */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Skeleton variant="text" width={150} sx={{ p: 2, pb: 1 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="25%" />
                </Box>
                <Skeleton variant="rounded" width={100} height={24} />
                <Skeleton variant="rounded" width={70} height={24} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (locationsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load locations. Please try again.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Locations
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/locations/new")}
          >
            Add Location
          </Button>
        )}
      </Box>

      {/* Map Section */}
      <Paper elevation={2} sx={{ mb: 3, overflow: "hidden", borderRadius: 2 }}>
        <Box sx={{ height: 400, width: "100%" }}>
          {mapLoading ? (
            <Skeleton variant="rectangular" height="100%" animation="pulse" />
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {validMapPins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={[parseFloat(pin.latitude), parseFloat(pin.longitude)]}
                  icon={createMarkerIcon(pin.is_active)}
                  eventHandlers={{
                    click: () => handleLocationClick(pin.id),
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {pin.name}
                      </Typography>
                      <Chip
                        label={pin.type === "education_center" ? "Education Center" : "Pop-up"}
                        size="small"
                        color={pin.type === "education_center" ? "primary" : "secondary"}
                        sx={{ mt: 0.5, mb: 0.5 }}
                      />
                      <br />
                      <Chip
                        label={pin.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={pin.is_active ? "success" : "error"}
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
      <Box display="flex" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              bgcolor: "#22c55e",
              border: "2px solid white",
              boxShadow: 1,
            }}
          />
          <Typography variant="body2">Active</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              bgcolor: "#ef4444",
              border: "2px solid white",
              boxShadow: 1,
            }}
          />
          <Typography variant="body2">Inactive</Typography>
        </Box>
      </Box>

      {/* Locations List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
            All Locations ({locations?.length ?? 0})
          </Typography>
          <List disablePadding>
            {(locations ?? []).map((location, index) => (
              <ListItem
                key={location.id}
                disablePadding
                divider={index < (locations?.length ?? 0) - 1}
              >
                <ListItemButton onClick={() => handleLocationClick(location.id)}>
                  <LocationOnIcon
                    sx={{
                      mr: 2,
                      color: location.is_active ? "success.main" : "error.main",
                    }}
                  />
                  <ListItemText
                    primary={location.name}
                    secondary={`${location.city}, ${location.state}`}
                  />
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip
                      label={
                        location.type === "education_center"
                          ? "Education Center"
                          : "Pop-up"
                      }
                      size="small"
                      color={
                        location.type === "education_center" ? "primary" : "secondary"
                      }
                      variant="outlined"
                    />
                    <Chip
                      label={location.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={location.is_active ? "success" : "error"}
                      variant="outlined"
                    />
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {(locations?.length ?? 0) === 0 && (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                No locations found. {isAdmin && "Click 'Add Location' to create one."}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}


