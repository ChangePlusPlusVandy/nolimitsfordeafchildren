"use client";

import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { listAllLocations } from "@/client/locations";
import { AGE_GROUP_LABELS, type AgeGroupSpecialty, createTeacher } from "@/client/teachers";
import { listUsers, type User } from "@/client/users";

export default function NewTeacherPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Form state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [primarySiteId, setPrimarySiteId] = useState("");
  const [ageGroupSpecialty, setAgeGroupSpecialty] = useState<AgeGroupSpecialty>("all_ages");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userTouched, setUserTouched] = useState(false);

  // Fetch available teacher users (users with teacher role without a profile)
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["users", "index", { role: "teacher", limit: 100 }],
    queryFn: () => listUsers({ role: "teacher", limit: 100 }),
  });

  // Fetch locations
  const {
    data: locations,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
  });

  const { mutate: createTeacherMutation, isPending } = useMutation({
    mutationKey: ["teachers", "create"],
    mutationFn: (payload: Parameters<typeof createTeacher>[0]) => createTeacher(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher profile created successfully");
      router.push(`/teachers/${data.id}`);
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
      setUserTouched(true);
      return;
    }

    const payload: Parameters<typeof createTeacher>[0] = {
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

    createTeacherMutation(payload);
  };

  const availableUsers = usersData?.items || [];

  return (
    <PageContainer>
      <PageHeader
        title="Create Teacher Profile"
        back="/teachers"
        breadcrumbs={[{ label: "Teachers", href: "/teachers" }, { label: "New Teacher" }]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {(usersError || locationsError) && (
        <ErrorAlert message="Failed to load required data. Please refresh the page." />
      )}

      <SectionCard sx={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* User Selection */}
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(user) => `${user.name} (${user.email})`}
              value={selectedUser}
              onChange={(_, newValue) => {
                setSelectedUser(newValue);
                if (newValue) setUserTouched(false);
                setError(null);
              }}
              onBlur={() => {
                if (!selectedUser) setUserTouched(true);
              }}
              loading={usersLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User *"
                  placeholder="Search for a user with teacher role..."
                  error={userTouched && !selectedUser}
                  helperText={userTouched && !selectedUser ? "Please select a user" : undefined}
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
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
                {(locations ?? []).map((location) => (
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
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => router.back()} disabled={isPending}>
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
            </Stack>
          </Stack>
        </form>
      </SectionCard>
    </PageContainer>
  );
}
