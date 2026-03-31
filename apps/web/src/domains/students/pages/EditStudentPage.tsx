import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
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
  Skeleton,
  Avatar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useStudentHttpService, type UpdateStudentInput } from "../services/StudentHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useToast } from "../../global/components/ToastProvider";

type FormData = {
  site_id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string;
  dob: string;
  current_school: string;
  preferred_language: string;
  guardian_summary: string;
  is_active: boolean;
};

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const locationHttpService = useLocationHttpService();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing student data
  const {
    data: student,
    isLoading: studentLoading,
    error: studentError,
  } = useQuery({
    queryKey: [studentHttpService.key, "show", id],
    queryFn: () => studentHttpService.queries.show(id!),
    enabled: !!id,
  });

  // Fetch locations for dropdown
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
  });

  // Initialize form data when student is loaded
  useEffect(() => {
    if (student) {
      setFormData({
        site_id: student.site_id,
        first_name: student.first_name,
        last_name: student.last_name,
        initials: student.initials,
        photo_url: student.photo_url || "",
        dob: student.dob.split("T")[0], // Format for date input
        current_school: student.current_school || "",
        preferred_language: student.preferred_language || "",
        guardian_summary: student.guardian_summary || "",
        is_active: student.is_active,
      });
    }
  }, [student]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: UpdateStudentInput & { id: string }) =>
      studentHttpService.mutations.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key] });
      toast.success("Student updated successfully");
      navigate(`/students/${id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update student. Please try again.");
    },
  });

  const handleChange =
    (field: keyof FormData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              [field]: event.target.value,
            }
          : null,
      );
      setError(null);
    };

  const handleSwitchChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              [field]: event.target.checked,
            }
          : null,
      );
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !id) return;

    // Basic validation
    if (!formData.first_name.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.last_name.trim()) {
      setError("Last name is required");
      return;
    }
    if (!formData.site_id) {
      setError("Site is required");
      return;
    }
    if (!formData.dob) {
      setError("Date of birth is required");
      return;
    }

    const payload: UpdateStudentInput & { id: string } = {
      id,
      site_id: formData.site_id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      initials: formData.initials.trim() || undefined,
      photo_url: formData.photo_url.trim() || undefined,
      dob: formData.dob,
      current_school: formData.current_school.trim() || undefined,
      preferred_language: formData.preferred_language.trim() || undefined,
      guardian_summary: formData.guardian_summary.trim() || undefined,
      is_active: formData.is_active,
    };

    mutate(payload);
  };

  const isLoading = studentLoading || locationsLoading;

  if (isLoading) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Box mb={3}>
          <Skeleton variant="rectangular" width={150} height={36} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Box display="flex" gap={2}>
            <Skeleton variant="rectangular" height={56} sx={{ flex: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ flex: 1 }} />
          </Box>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={120} />
        </Box>
      </Box>
    );
  }

  if (studentError || !student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {studentError ? "Failed to load student." : "Student not found."}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Box mb={3}>
          <Skeleton variant="rectangular" width={150} height={36} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
      </Box>
    );
  }

  const activeLocations = locations?.filter((loc) => loc.is_active) || [];

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/students/${id}`)}
          sx={{ mb: 1 }}
        >
          Back to Student
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={formData.photo_url || undefined}
            sx={{
              width: 60,
              height: 60,
              bgcolor: "primary.main",
              fontSize: "1.5rem",
            }}
          >
            {student.initials}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Edit Student
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {student.first_name} {student.last_name}
            </Typography>
          </Box>
        </Box>
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
              {/* Basic Information */}
              <Typography variant="h6" color="primary">
                Basic Information
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange("first_name")}
                  required
                  sx={{ flex: "1 1 200px" }}
                />

                <TextField
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange("last_name")}
                  required
                  sx={{ flex: "1 1 200px" }}
                />
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="Initials"
                  value={formData.initials}
                  onChange={handleChange("initials")}
                  sx={{ flex: "1 1 100px" }}
                  placeholder="e.g., JD"
                  helperText="Used for privacy in lists"
                />

                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange("dob")}
                  required
                  sx={{ flex: "1 1 200px" }}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              </Box>

              <TextField
                label="Headshot URL"
                value={formData.photo_url}
                onChange={handleChange("photo_url")}
                fullWidth
                placeholder="https://..."
                helperText="Optional profile photo URL for student cards and details"
              />

              <FormControlLabel
                control={
                  <Switch checked={formData.is_active} onChange={handleSwitchChange("is_active")} />
                }
                label="Active"
              />

              {/* Location */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Location & School
              </Typography>

              <FormControl fullWidth required>
                <InputLabel>Site</InputLabel>
                <Select value={formData.site_id} label="Site" onChange={handleChange("site_id")}>
                  {activeLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} ({location.type.replace("_", " ")})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Current School"
                value={formData.current_school}
                onChange={handleChange("current_school")}
                fullWidth
                placeholder="Name of the school the student attends"
              />

              {/* Additional Information */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Additional Information
              </Typography>

              <TextField
                label="Preferred Language"
                value={formData.preferred_language}
                onChange={handleChange("preferred_language")}
                fullWidth
                placeholder="e.g., English, Spanish"
              />

              <TextField
                label="Guardian Summary"
                value={formData.guardian_summary}
                onChange={handleChange("guardian_summary")}
                fullWidth
                multiline
                rows={3}
                placeholder="Brief notes about the student's guardians..."
              />
            </Box>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => navigate(`/students/${id}`)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
