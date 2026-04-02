import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Avatar,
  FormHelperText,
  Stack,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { FormSkeleton } from "../../global/components/skeletons";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import { useStudentHttpService, type UpdateStudentInput } from "../services/StudentHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useToast } from "../../global/components/ToastProvider";
import { useAuth } from "../../../auth";

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
  hearing_devices: string[];
  hearing_loss_type: string;
  other_hearing_device: string;
};

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const locationHttpService = useLocationHttpService();
  const toast = useToast();
  const { isAdmin, isTeacher } = useAuth();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "first_name":
        return value.trim() ? "" : "First name is required";
      case "last_name":
        return value.trim() ? "" : "Last name is required";
      case "site_id":
        return value ? "" : "Site is required";
      case "dob":
        return value ? "" : "Date of birth is required";
      default:
        return "";
    }
  };

  const handleBlur = (field: keyof FormData) => () => {
    if (!formData) return;
    const err = validateField(field, formData[field] as string);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Fetch existing student data
  const {
    data: student,
    isLoading: studentLoading,
    error: studentError,
    refetch,
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
        dob: student.dob.split("T")[0] ?? student.dob, // Format for date input
        current_school: student.current_school || "",
        preferred_language: student.preferred_language || "",
        guardian_summary: student.guardian_summary || "",
        is_active: student.is_active,
        hearing_devices: (student.hearing_devices || []).filter((value) => value !== "Other"),
        hearing_loss_type: student.hearing_loss_type || "",
        other_hearing_device: (student.hearing_devices || []).find((value) => {
          return !["BAHA", "Hearing Aid", "Cochlear Implant"].includes(value);
        }) || "",
      });
    }
  }, [student]);

  const hearingDeviceOptions = ["BAHA", "Hearing Aid", "Cochlear Implant", "Other"];
  const hearingLossOptions = [
    { value: "mild", label: "Mild" },
    { value: "moderate", label: "Moderate" },
    { value: "moderately_severe", label: "Moderately Severe" },
    { value: "severe", label: "Severe" },
    { value: "profound", label: "Profound" },
    { value: "unknown", label: "Unknown" },
  ];

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
              [field]: (event.target as any).value,
            }
          : null,
      );
      setError(null);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const handleSwitchChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              [field]: (event.target as any).checked,
            }
          : null,
      );
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !id) return;

    // Inline validation
    const errors: Record<string, string> = {};
    const requiredFields: (keyof FormData)[] = ["first_name", "last_name", "site_id", "dob"];
    for (const field of requiredFields) {
      const err = validateField(field, formData[field] as string);
      if (err) errors[field] = err;
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setError("Please fix the highlighted fields.");
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
      hearing_devices: [
        ...formData.hearing_devices.filter((value) => value !== "Other"),
        ...(formData.hearing_devices.includes("Other") && formData.other_hearing_device.trim()
          ? [formData.other_hearing_device.trim()]
          : []),
      ],
      hearing_loss_type: formData.hearing_loss_type
        ? (formData.hearing_loss_type as any)
        : null,
      is_active: formData.is_active,
    };

    if (isAdmin) {
      payload.guardian_summary = formData.guardian_summary.trim() || undefined;
    }

    mutate(payload);
  };

  const isLoading = studentLoading || locationsLoading;

  const breadcrumbs = [
    { label: "Students", href: "/students" },
    { label: student ? `${student.first_name} ${student.last_name}` : "Student", href: `/students/${id}` },
    { label: "Edit" },
  ];

  if (isLoading) {
    return (
      <PageContainer maxWidth="md">
        <PageHeader title="Edit Student" breadcrumbs={breadcrumbs} back={`/students/${id}`} />
        <FormSkeleton fields={8} />
      </PageContainer>
    );
  }

  if (studentError || !student) {
    return (
      <PageContainer maxWidth="md">
        <PageHeader title="Edit Student" breadcrumbs={breadcrumbs} back={`/students/${id}`} />
        <ErrorAlert
          message={studentError ? "Failed to load student." : "Student not found."}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  if (!formData) {
    return (
      <PageContainer maxWidth="md">
        <PageHeader title="Edit Student" breadcrumbs={breadcrumbs} back={`/students/${id}`} />
        <FormSkeleton fields={6} />
      </PageContainer>
    );
  }

  const activeLocations = locations?.filter((loc) => loc.is_active) || [];

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Edit Student"
        subtitle={`${student.first_name} ${student.last_name}`}
        breadcrumbs={breadcrumbs}
        back={`/students/${id}`}
      />

      {error && (
        <ErrorAlert message={error} sx={{ mb: 3 }} />
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
        <SectionCard title="Basic Information">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
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
            <Typography variant="body2" color="text.secondary">
              {student.first_name} {student.last_name}
            </Typography>
          </Box>

          <Stack spacing={3}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={handleChange("first_name")}
                onBlur={handleBlur("first_name")}
                error={!!fieldErrors.first_name}
                helperText={fieldErrors.first_name}
                required
                sx={{ flex: "1 1 200px" }}
              />

              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange("last_name")}
                onBlur={handleBlur("last_name")}
                error={!!fieldErrors.last_name}
                helperText={fieldErrors.last_name}
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
                onBlur={handleBlur("dob")}
                error={!!fieldErrors.dob}
                helperText={fieldErrors.dob}
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
          </Stack>
        </SectionCard>

        <SectionCard title="Location & School">
          <Stack spacing={3}>
            <FormControl fullWidth required error={!!fieldErrors.site_id}>
              <InputLabel>Site</InputLabel>
              <Select value={formData.site_id} label="Site" onChange={handleChange("site_id")}>
                {activeLocations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} ({location.type.replace("_", " ")})
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.site_id && <FormHelperText>{fieldErrors.site_id}</FormHelperText>}
            </FormControl>

            <TextField
              label="Current School"
              value={formData.current_school}
              onChange={handleChange("current_school")}
              fullWidth
              placeholder="Name of the school the student attends"
            />
          </Stack>
        </SectionCard>

        <SectionCard title="Additional Information">
          <Stack spacing={3}>
            <TextField
              label="Preferred Language"
              value={formData.preferred_language}
              onChange={handleChange("preferred_language")}
              fullWidth
              placeholder="e.g., English, Spanish"
            />

            <FormControl fullWidth>
              <InputLabel>Hearing Devices</InputLabel>
              <Select
                multiple
                value={formData.hearing_devices}
                label="Hearing Devices"
                onChange={(event) => {
                  const values = event.target.value as string[];
                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          hearing_devices: values,
                        }
                      : null,
                  );
                }}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {hearingDeviceOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select one or more devices</FormHelperText>
            </FormControl>

            {formData.hearing_devices.includes("Other") && (
              <TextField
                label="Other Hearing Device"
                value={formData.other_hearing_device}
                onChange={handleChange("other_hearing_device")}
                fullWidth
                placeholder="Describe other device"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Hearing Loss Type</InputLabel>
              <Select
                value={formData.hearing_loss_type}
                label="Hearing Loss Type"
                onChange={handleChange("hearing_loss_type")}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {hearingLossOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Guardian Summary"
              value={formData.guardian_summary}
              onChange={handleChange("guardian_summary")}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief notes about the student's guardians..."
              InputProps={{
                readOnly: !isAdmin,
              }}
              helperText={
                isAdmin
                  ? undefined
                  : isTeacher
                    ? "Teachers can update guardian summary from Teacher Student Details."
                    : "Guardian summary can only be edited by staff."
              }
            />
          </Stack>
        </SectionCard>

        {/* Submit Button */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
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
        </Stack>
        </Stack>
      </form>
    </PageContainer>
  );
}
