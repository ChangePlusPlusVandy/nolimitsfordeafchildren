import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import {
  useTeacherHttpService,
  AGE_GROUP_LABELS,
  type AgeGroupSpecialty,
  type CreateTeacherInput,
} from "../services/TeacherHttpService";
import { useUserHttpService, type User } from "../../users/services/UserHttpService";
import { useLocationHttpService, type Location } from "../../locations/services/LocationHttpService";
import { useToast } from "../../global/components/ToastProvider";

export default function NewTeacherPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teacherHttpService = useTeacherHttpService();
  const userHttpService = useUserHttpService();
  const locationHttpService = useLocationHttpService();
  const toast = useToast();

  // Form state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [primarySiteId, setPrimarySiteId] = useState("");
  const [ageGroupSpecialty, setAgeGroupSpecialty] = useState<AgeGroupSpecialty>("all_ages");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch available teacher users (users with teacher role without a profile)
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: [userHttpService.key, "index", { role: "teacher", limit: 100 }],
    queryFn: () => userHttpService.queries.index({ role: "teacher", limit: 100 }),
  });

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading, isError: locationsError } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
  });

  const { mutate: createTeacher, isPending } = useMutation({
    mutationKey: [teacherHttpService.key, "create"],
    mutationFn: teacherHttpService.mutations.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [teacherHttpService.key] });
      toast.success("Teacher profile created successfully");
      navigate(`/teachers/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create teacher profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    const payload: CreateTeacherInput = {
      user_id: selectedUser.id,
      age_group_specialty: ageGroupSpecialty,
    };

    if (primarySiteId) {
      payload.primary_site_id = primarySiteId;
    }
    if (bio.trim()) {
      payload.bio = bio.trim();
    }
    if (qualifications.trim()) {
      payload.qualifications = qualifications.trim();
    }
    if (credentials.trim()) {
      payload.credentials = credentials.trim();
    }

    createTeacher(payload);
  };

  const availableUsers = usersData?.items || [];
  const locations = (locationsData || []) as Location[];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Create Teacher Profile
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {(usersError || locationsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load required data. Please refresh the page.
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* User Selection */}
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(user) => `${user.name} (${user.email})`}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              loading={usersLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User *"
                  placeholder="Search for a user with teacher role..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            {/* Primary Site */}
            <FormControl fullWidth>
              <InputLabel>Primary Site</InputLabel>
              <Select
                value={primarySiteId}
                label="Primary Site"
                onChange={(e) => setPrimarySiteId(e.target.value)}
                disabled={locationsLoading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Age Group Specialty */}
            <FormControl fullWidth>
              <InputLabel>Age Group Specialty *</InputLabel>
              <Select
                value={ageGroupSpecialty}
                label="Age Group Specialty *"
                onChange={(e) => setAgeGroupSpecialty(e.target.value as AgeGroupSpecialty)}
              >
                {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Bio */}
            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              multiline
              rows={3}
              placeholder="Brief description about the teacher..."
            />

            {/* Qualifications */}
            <TextField
              label="Qualifications"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              multiline
              rows={2}
              placeholder="Education, certifications, etc..."
            />

            {/* Credentials */}
            <TextField
              label="Credentials"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g., M.Ed., CCC-SLP"
            />

            {/* Submit */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={isPending || !selectedUser}
              >
                {isPending ? "Creating..." : "Create Teacher"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
