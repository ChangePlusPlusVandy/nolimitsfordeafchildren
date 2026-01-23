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
  Alert,
  CircularProgress,
  Skeleton,
  Avatar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import {
  useTeacherHttpService,
  AGE_GROUP_LABELS,
  type AgeGroupSpecialty,
  type UpdateTeacherInput,
} from "../services/TeacherHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useToast } from "../../global/components/ToastProvider";

type FormData = {
  primary_site_id: string;
  bio: string;
  qualifications: string;
  credentials: string;
  age_group_specialty: AgeGroupSpecialty | "";
};

export default function EditTeacherPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teacherHttpService = useTeacherHttpService();
  const locationHttpService = useLocationHttpService();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing teacher data
  const {
    data: teacher,
    isLoading: teacherLoading,
    error: teacherError,
  } = useQuery({
    queryKey: [teacherHttpService.key, "show", id],
    queryFn: () => teacherHttpService.queries.show(id!),
    enabled: !!id,
  });

  // Fetch locations for dropdown
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
  });

  // Initialize form data when teacher is loaded
  useEffect(() => {
    if (teacher) {
      setFormData({
        primary_site_id: teacher.primary_site_id || "",
        bio: teacher.bio || "",
        qualifications: teacher.qualifications || "",
        credentials: teacher.credentials || "",
        age_group_specialty: teacher.age_group_specialty || "",
      });
    }
  }, [teacher]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: UpdateTeacherInput & { id: string }) =>
      teacherHttpService.mutations.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherHttpService.key] });
      toast.success("Teacher updated successfully");
      navigate(`/teachers/${id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update teacher. Please try again.");
    },
  });

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [field]: event.target.value,
          }
        : null
    );
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !id) return;

    const payload: UpdateTeacherInput & { id: string } = {
      id,
      primary_site_id: formData.primary_site_id || undefined,
      bio: formData.bio.trim() || undefined,
      qualifications: formData.qualifications.trim() || undefined,
      credentials: formData.credentials.trim() || undefined,
      age_group_specialty: formData.age_group_specialty || undefined,
    };

    mutate(payload);
  };

  const isLoading = teacherLoading || locationsLoading;

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
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={120} />
        </Box>
      </Box>
    );
  }

  if (teacherError || !teacher) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {teacherError ? "Failed to load teacher." : "Teacher not found."}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
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
          onClick={() => navigate(`/teachers/${id}`)}
          sx={{ mb: 1 }}
        >
          Back to Teacher
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={teacher.photo_url || undefined}
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <PersonIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Edit Teacher
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {teacher.user.name} - {teacher.user.email}
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
              {/* Read-only user info */}
              <Alert severity="info" sx={{ mb: 1 }}>
                To change the teacher's name, email, or phone, go to{" "}
                <Button
                  size="small"
                  onClick={() => navigate(`/users/${teacher.user_id}`)}
                  sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
                >
                  User Management
                </Button>
              </Alert>

              {/* Primary Site */}
              <Typography variant="h6" color="primary">
                Assignment
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Primary Site</InputLabel>
                <Select
                  value={formData.primary_site_id}
                  label="Primary Site"
                  onChange={handleChange("primary_site_id")}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {activeLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} ({location.type.replace("_", " ")})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Age Group Specialty */}
              <FormControl fullWidth>
                <InputLabel>Age Group Specialty</InputLabel>
                <Select
                  value={formData.age_group_specialty}
                  label="Age Group Specialty"
                  onChange={handleChange("age_group_specialty")}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {(Object.keys(AGE_GROUP_LABELS) as AgeGroupSpecialty[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      {AGE_GROUP_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Profile Information */}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Profile Information
              </Typography>

              <TextField
                label="Bio"
                value={formData.bio}
                onChange={handleChange("bio")}
                fullWidth
                multiline
                rows={3}
                placeholder="A brief biography about the teacher..."
              />

              <TextField
                label="Qualifications"
                value={formData.qualifications}
                onChange={handleChange("qualifications")}
                fullWidth
                multiline
                rows={3}
                placeholder="Educational background, certifications, etc..."
              />

              <TextField
                label="Credentials"
                value={formData.credentials}
                onChange={handleChange("credentials")}
                fullWidth
                multiline
                rows={3}
                placeholder="Professional credentials and licenses..."
              />
            </Box>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => navigate(`/teachers/${id}`)}>
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
