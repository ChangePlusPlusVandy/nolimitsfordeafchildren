import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  Skeleton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VideocamIcon from "@mui/icons-material/Videocam";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useLocationHttpService, type LocationType } from "../services/LocationHttpService";
import { useAuth } from "../../../auth";

export default function LocationDetailsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const locationHttpService = useLocationHttpService();

  const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
    education_center: "Education Center",
    pop_up: "Pop-up",
    remote: "Remote",
  };

  const {
    data: location,
    isLoading,
    error,
  } = useQuery({
    queryKey: [locationHttpService.key, "show", siteId],
    queryFn: () => locationHttpService.queries.show(siteId!),
    enabled: !!siteId,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header Skeleton */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Skeleton variant="rounded" width={150} height={36} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={250} height={40} />
            <Box display="flex" gap={1} mt={1}>
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={80} height={32} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>
        {/* Cards Skeleton */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
            <CardContent>
              <Skeleton variant="text" width={100} height={28} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
          </Card>
          <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
            <CardContent>
              <Skeleton variant="text" width={80} height={28} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="45%" />
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (error || !location) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error ? "Failed to load location details." : "Location not found."}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/locations")} sx={{ mt: 2 }}>
          Back to Locations
        </Button>
      </Box>
    );
  }

  const formatAddress = () => {
    const parts = [
      location.address_line1,
      location.address_line2,
      `${location.city}, ${location.state} ${location.postal_code}`,
      location.country !== "USA" ? location.country : null,
    ].filter(Boolean);
    return parts;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/locations")}
            sx={{ mb: 1 }}
          >
            Back to Locations
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {location.name}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={LOCATION_TYPE_LABEL[location.type]}
              variant="outlined"
            />
            <Chip
              label={location.is_active ? "Active" : "Inactive"}
              color={location.is_active ? "success" : "default"}
              variant={location.is_active ? "filled" : "outlined"}
            />
          </Box>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/locations/${siteId}/edit`)}
          >
            Edit Location
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Address Card */}
        <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocationOnIcon color="primary" />
              <Typography variant="h6">Address</Typography>
            </Box>
            <Box>
              {formatAddress().map((line, index) => (
                <Typography key={index} variant="body1">
                  {line}
                </Typography>
              ))}
            </Box>
            {location.latitude && location.longitude && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Coordinates: {location.latitude}, {location.longitude}
                </Typography>
                <Button
                  size="small"
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 1 }}
                >
                  View on Google Maps
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <AccessTimeIcon color="primary" />
              <Typography variant="h6">Details</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Timezone
                </Typography>
                <Typography variant="body1">{location.timezone}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(location.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(location.updated_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Zoom Link Card */}
        {location.zoom_link && (
          <Card sx={{ flex: "1 1 100%", minWidth: 300 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <VideocamIcon color="primary" />
                <Typography variant="h6">Virtual Meeting</Typography>
              </Box>
              <Button
                variant="outlined"
                href={location.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<VideocamIcon />}
              >
                Join Zoom Meeting
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {location.zoom_link}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
