import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useStudentHttpService, type CreateStudentInput } from "../services/StudentHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";

export default function NewStudentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const locationHttpService = useLocationHttpService();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initials, setInitials] = useState("");
  const [dob, setDob] = useState("");
  const [siteId, setSiteId] = useState("");
  const [currentSchool, setCurrentSchool] = useState("");
  const [guardianSummary, setGuardianSummary] = useState("");

  // Auto-generate initials from first and last name
  useEffect(() => {
    if (firstName && lastName && !initials) {
      const autoInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      setInitials(autoInitials);
    }
  }, [firstName, lastName]);

  // Fetch locations for the dropdown
  const { data: locationsData, isLoading: locationsLoading, isError: locationsError } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
  });

  const locations = Array.isArray(locationsData) 
    ? locationsData 
    : ((locationsData as any)?.items || []);

  const mutation = useMutation({
    mutationFn: (data: CreateStudentInput) => studentHttpService.mutations.create(data),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key] });
      navigate(`/students/${student.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !siteId) return;

    mutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      initials: initials.trim() || undefined,
      dob,
      site_id: siteId,
      current_school: currentSchool.trim() || undefined,
      guardian_summary: guardianSummary.trim() || undefined,
    });
  };

  const isValid = firstName.trim() && lastName.trim() && dob && siteId;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Student
        </Typography>
      </Box>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(mutation.error as Error)?.message || "Failed to create student. Please try again."}
        </Alert>
      )}

      {locationsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load sites. Please refresh the page.
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the student's information. Required fields are marked with an asterisk (*).
            </Typography>

            {/* Name Fields */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                fullWidth
                autoFocus
                placeholder="John"
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                fullWidth
                placeholder="Doe"
              />
            </Box>

            {/* Initials (auto-generated but editable) */}
            <TextField
              label="Initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              fullWidth
              inputProps={{ maxLength: 8 }}
              helperText="Auto-generated from name. Shown in list views for privacy."
              placeholder="JD"
            />

            {/* Date of Birth */}
            <TextField
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            {/* Site Dropdown */}
            <FormControl fullWidth required>
              <InputLabel>Site *</InputLabel>
              <Select
                value={siteId}
                label="Site *"
                onChange={(e) => setSiteId(e.target.value)}
                disabled={locationsLoading}
              >
                {locationsLoading && (
                  <MenuItem value="" disabled>
                    Loading sites...
                  </MenuItem>
                )}
                {Array.isArray(locations) && locations.map((location: any) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} ({location.type?.replace("_", " ")})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Current School */}
            <TextField
              label="Current School"
              value={currentSchool}
              onChange={(e) => setCurrentSchool(e.target.value)}
              fullWidth
              placeholder="Enter current school name"
            />

            {/* Guardian Summary */}
            <TextField
              label="Guardian Summary"
              value={guardianSummary}
              onChange={(e) => setGuardianSummary(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief summary of guardians/family situation"
            />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={mutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={!isValid || mutation.isPending}
              >
                Create Student
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
