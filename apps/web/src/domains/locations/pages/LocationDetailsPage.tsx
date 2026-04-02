import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VideocamIcon from "@mui/icons-material/Videocam";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import { formatDate } from "../../../utils/formatDate";
import { useLocationHttpService, type LocationType } from "../services/LocationHttpService";
import { useAuth } from "../../../auth";

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  education_center: "Education Center",
  pop_up: "Pop-up",
  remote: "Remote",
};

export default function LocationDetailsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const locationHttpService = useLocationHttpService();

  const {
    data: location,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [locationHttpService.key, "show", siteId],
    queryFn: () => locationHttpService.queries.show(siteId!),
    enabled: !!siteId,
  });

  const breadcrumbs = [
    { label: "Locations", href: "/locations" },
    { label: location?.name ?? "Location Details" },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <DetailPageSkeleton />
      </PageContainer>
    );
  }

  if (error || !location) {
    return (
      <PageContainer>
        <PageHeader title="Location Details" back="/locations" breadcrumbs={breadcrumbs} />
        <ErrorAlert
          message={error ? "Failed to load location details." : "Location not found."}
          onRetry={error ? () => refetch() : undefined}
        />
      </PageContainer>
    );
  }

  const formatAddress = () => {
    return [
      location.address_line1,
      location.address_line2,
      `${location.city}, ${location.state} ${location.postal_code}`,
      location.country !== "USA" ? location.country : null,
    ].filter(Boolean);
  };

  return (
    <PageContainer>
      <PageHeader
        title={location.name}
        breadcrumbs={breadcrumbs}
        back="/locations"
        actions={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/locations/${siteId}/edit`)}
            >
              Edit Location
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip label={LOCATION_TYPE_LABEL[location.type]} variant="outlined" />
        <Chip
          label={location.is_active ? "Active" : "Inactive"}
          color={location.is_active ? "success" : "default"}
          variant={location.is_active ? "filled" : "outlined"}
        />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {/* Address Card */}
        <SectionCard title="Address" icon={<LocationOnIcon color="primary" />}>
          {formatAddress().map((line, index) => (
            <Typography key={index} variant="body1">
              {line}
            </Typography>
          ))}
          {location.latitude && location.longitude && (
            <Box sx={{ mt: 2 }}>
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
        </SectionCard>

        {/* Details Card */}
        <SectionCard title="Details" icon={<AccessTimeIcon color="primary" />}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Timezone
            </Typography>
            <Typography variant="body1">{location.timezone}</Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">{formatDate(location.created_at)}</Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">{formatDate(location.updated_at)}</Typography>
          </Box>
        </SectionCard>

        {/* Zoom Link Card */}
        {location.zoom_link && (
          <SectionCard
            title="Virtual Meeting"
            icon={<VideocamIcon color="primary" />}
            sx={{ gridColumn: { md: "1 / -1" } }}
          >
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
          </SectionCard>
        )}
      </Box>
    </PageContainer>
  );
}
