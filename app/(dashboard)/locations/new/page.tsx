"use client";

import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { type CreateLocationPayload, createLocation, type LocationType } from "@/client/locations";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "name":
        return value.trim() ? "" : "Name is required";
      case "address_line1":
        return value.trim() ? "" : "Address is required";
      case "city":
        return value.trim() ? "" : "City is required";
      case "state":
        return value ? "" : "State is required";
      case "postal_code":
        return value.trim() ? "" : "Postal code is required";
      default:
        return "";
    }
  };

  const handleBlur = (field: keyof FormData) => () => {
    const err = validateField(field, formData[field] as string);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocation(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created successfully");
      router.push(`/locations/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create location. Please try again.");
    },
  });

  const handleChange =
    (field: keyof FormData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: (event.target as { value: unknown }).value as string,
      }));
      setError(null);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const handleSwitchChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.checked }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const requiredFields: (keyof FormData)[] = [
      "name",
      "address_line1",
      "city",
      "state",
      "postal_code",
    ];
    for (const field of requiredFields) {
      const err = validateField(field, formData[field] as string);
      if (err) errors[field] = err;
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setError("Please fix the highlighted fields.");
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

  const breadcrumbs = [{ label: "Locations", href: "/locations" }, { label: "New Location" }];

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Add New Location" breadcrumbs={breadcrumbs} back="/locations" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <SectionCard title="Basic Information">
            <Stack spacing={3}>
              <TextField
                label="Location Name"
                value={formData.name}
                onChange={handleChange("name")}
                onBlur={handleBlur("name")}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                required
                fullWidth
                placeholder="e.g., Los Angeles Education Center"
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={handleChange("type")}>
                  <MenuItem value="education_center">Education Center</MenuItem>
                  <MenuItem value="pop_up">Pop-up</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch checked={formData.is_active} onChange={handleSwitchChange("is_active")} />
                }
                label="Active"
              />
            </Stack>
          </SectionCard>

          <SectionCard title="Address">
            <Stack spacing={3}>
              <TextField
                label="Address Line 1"
                value={formData.address_line1}
                onChange={handleChange("address_line1")}
                onBlur={handleBlur("address_line1")}
                error={!!fieldErrors.address_line1}
                helperText={fieldErrors.address_line1}
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
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="City"
                  value={formData.city}
                  onChange={handleChange("city")}
                  onBlur={handleBlur("city")}
                  error={!!fieldErrors.city}
                  helperText={fieldErrors.city}
                  required
                  sx={{ flex: "2 1 200px" }}
                />
                <FormControl sx={{ flex: "1 1 100px" }} required error={!!fieldErrors.state}>
                  <InputLabel>State</InputLabel>
                  <Select value={formData.state} label="State" onChange={handleChange("state")}>
                    {US_STATES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.state && <FormHelperText>{fieldErrors.state}</FormHelperText>}
                </FormControl>
                <TextField
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={handleChange("postal_code")}
                  onBlur={handleBlur("postal_code")}
                  error={!!fieldErrors.postal_code}
                  helperText={fieldErrors.postal_code}
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
            </Stack>
          </SectionCard>

          <SectionCard title="Coordinates (Optional)">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Used for displaying the location on the map.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Latitude"
                value={formData.latitude}
                onChange={handleChange("latitude")}
                sx={{ flex: "1 1 150px" }}
                placeholder="e.g., 34.052235"
                type="number"
                slotProps={{ htmlInput: { step: "any" } }}
              />
              <TextField
                label="Longitude"
                value={formData.longitude}
                onChange={handleChange("longitude")}
                sx={{ flex: "1 1 150px" }}
                placeholder="e.g., -118.243683"
                type="number"
                slotProps={{ htmlInput: { step: "any" } }}
              />
            </Box>
          </SectionCard>

          <SectionCard title="Settings">
            <Stack spacing={3}>
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
            </Stack>
          </SectionCard>

          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={() => router.push("/locations")}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Location"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </PageContainer>
  );
}
