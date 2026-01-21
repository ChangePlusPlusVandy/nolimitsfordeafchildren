import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  useLocationHttpService,
  type CreateLocationPayload,
  type LocationType,
} from "../services/LocationHttpService";

// Common US timezones
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
];

type FormData = {
  name: string;
  type: LocationType;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
  timezone: string;
  zoom_link: string;
  is_active: boolean;
};

const initialFormData: FormData = {
  name: "",
  type: "pop_up",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "USA",
  latitude: "",
  longitude: "",
  timezone: "America/Los_Angeles",
  zoom_link: "",
  is_active: true,
};

export default function NewLocationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locationHttpService = useLocationHttpService();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: locationHttpService.mutations.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [locationHttpService.key] });
      navigate(`/locations/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create location. Please try again.");
    },
  });

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleSwitchChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.address_line1.trim()) {
      setError("Address is required");
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return;
    }
    if (!formData.state) {
      setError("State is required");
      return;
    }
    if (!formData.postal_code.trim()) {
      setError("Postal code is required");
      return;
    }

    const payload: CreateLocationPayload = {
      name: formData.name.trim(),
      type: formData.type,
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2.trim() || null,
      city: formData.city.trim(),
      state: formData.state,
      postal_code: formData.postal_code.trim(),
      country: formData.country,
      latitude: formData.latitude.trim() || null,
      longitude: formData.longitude.trim() || null,
      timezone: formData.timezone,
      zoom_link: formData.zoom_link.trim() || null,
      is_active: formData.is_active,
    };

    mutate(payload);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/locations")}
          sx={{ mb: 1 }}
        >
          Back to Locations
        </Button>
        <Typography variant="h4" component="h1">
          Add New Location
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Basic Info */}
              <Typography variant="h6" color="primary">
                Basic Information
              </Typography>

              <TextField
                label="Location Name"
                value={formData.name}
                onChange={handleChange("name")}
                required
                fullWidth
                placeholder="e.g., Los Angeles Education Center"
              />

              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={handleChange("type")}
                >
                  <MenuItem value="education_center">Education Center</MenuItem>
                  <MenuItem value="pop_up">Pop-up</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleSwitchChange("is_active")}
                  />
                }
                label="Active"
              />

              {/* Address */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Address
              </Typography>

              <TextField
                label="Address Line 1"
                value={formData.address_line1}
                onChange={handleChange("address_line1")}
                required
                fullWidth
                placeholder="e.g., 123 Main Street"
              />

              <TextField
                label="Address Line 2"
                value={formData.address_line2}
                onChange={handleChange("address_line2")}
                fullWidth
                placeholder="e.g., Suite 100"
              />

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="City"
                  value={formData.city}
                  onChange={handleChange("city")}
                  required
                  sx={{ flex: "2 1 200px" }}
                />

                <FormControl sx={{ flex: "1 1 100px" }} required>
                  <InputLabel>State</InputLabel>
                  <Select
                    value={formData.state}
                    label="State"
                    onChange={handleChange("state")}
                  >
                    {US_STATES.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={handleChange("postal_code")}
                  required
                  sx={{ flex: "1 1 100px" }}
                  placeholder="e.g., 90001"
                />
              </Box>

              <TextField
                label="Country"
                value={formData.country}
                onChange={handleChange("country")}
                fullWidth
                disabled
              />

              {/* Coordinates */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Coordinates (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: -2 }}>
                Used for displaying the location on the map
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="Latitude"
                  value={formData.latitude}
                  onChange={handleChange("latitude")}
                  sx={{ flex: "1 1 150px" }}
                  placeholder="e.g., 34.052235"
                  type="number"
                  inputProps={{ step: "any" }}
                />

                <TextField
                  label="Longitude"
                  value={formData.longitude}
                  onChange={handleChange("longitude")}
                  sx={{ flex: "1 1 150px" }}
                  placeholder="e.g., -118.243683"
                  type="number"
                  inputProps={{ step: "any" }}
                />
              </Box>

              {/* Settings */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Settings
              </Typography>

              <FormControl fullWidth required>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={formData.timezone}
                  label="Timezone"
                  onChange={handleChange("timezone")}
                >
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Zoom Link"
                value={formData.zoom_link}
                onChange={handleChange("zoom_link")}
                fullWidth
                placeholder="e.g., https://zoom.us/j/123456789"
                type="url"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => navigate("/locations")}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Location"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}


