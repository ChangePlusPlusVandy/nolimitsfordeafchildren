"use client";

import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/client/components/ToastProvider";
import { listAllLocations } from "@/client/locations";
import { type CreateStudentInput, createStudent } from "@/client/students";

interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateStudentModal({ open, onClose }: CreateStudentModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initials, setInitials] = useState("");
  const [dob, setDob] = useState("");
  const [siteId, setSiteId] = useState("");
  const [currentSchool, setCurrentSchool] = useState("");
  const [hearingDevices, setHearingDevices] = useState<string[]>([]);
  const [otherHearingDevice, setOtherHearingDevice] = useState("");
  const [hearingLossType, setHearingLossType] = useState<string>("");
  const [guardianSummary, setGuardianSummary] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        return value.trim() ? "" : "First name is required";
      case "lastName":
        return value.trim() ? "" : "Last name is required";
      case "dob":
        return value ? "" : "Date of birth is required";
      case "siteId":
        return value ? "" : "Site is required";
      default:
        return "";
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    const err = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const hearingDeviceOptions = ["BAHA", "Hearing Aid", "Cochlear Implant", "Other"];
  const hearingLossOptions = [
    { value: "mild", label: "Mild" },
    { value: "moderate", label: "Moderate" },
    { value: "moderately_severe", label: "Moderately Severe" },
    { value: "severe", label: "Severe" },
    { value: "profound", label: "Profound" },
    { value: "unknown", label: "Unknown" },
  ];

  // Auto-generate initials from first and last name
  useEffect(() => {
    if (firstName && lastName && !initials) {
      const autoInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      setInitials(autoInitials);
    }
  }, [firstName, lastName, initials]);

  // Fetch locations for the dropdown
  const {
    data: locations,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
    enabled: open, // Only fetch when modal is open
  });

  const mutation = useMutation({
    mutationFn: (data: CreateStudentInput) => createStudent(data),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student created successfully");
      handleClose();
      router.push(`/students/${student.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create student");
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      // Reset form state
      setFirstName("");
      setLastName("");
      setInitials("");
      setDob("");
      setSiteId("");
      setCurrentSchool("");
      setHearingDevices([]);
      setOtherHearingDevice("");
      setHearingLossType("");
      setGuardianSummary("");
      setFieldErrors({});
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    errors.firstName = validateField("firstName", firstName);
    errors.lastName = validateField("lastName", lastName);
    errors.dob = validateField("dob", dob);
    errors.siteId = validateField("siteId", siteId);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    mutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      initials: initials.trim() || undefined,
      dob,
      site_id: siteId,
      current_school: currentSchool.trim() || undefined,
      hearing_devices: [
        ...hearingDevices.filter((value) => value !== "Other"),
        ...(hearingDevices.includes("Other") && otherHearingDevice.trim()
          ? [otherHearingDevice.trim()]
          : []),
      ],
      hearing_loss_type: hearingLossType ? (hearingLossType as never) : null,
      guardian_summary: guardianSummary.trim() || undefined,
    });
  };

  const isValid = firstName.trim() && lastName.trim() && dob && siteId;
  const isDisabled = mutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>New Student</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the student&apos;s information. Required fields are marked with an asterisk (*).
            </Typography>

            {locationsError && (
              <Alert severity="error">Failed to load sites. Please try again.</Alert>
            )}

            {/* Name Fields */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
                onBlur={() => handleFieldBlur("firstName", firstName)}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
                required
                fullWidth
                autoFocus
                placeholder="John"
                disabled={isDisabled}
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
                onBlur={() => handleFieldBlur("lastName", lastName)}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
                required
                fullWidth
                placeholder="Doe"
                disabled={isDisabled}
              />
            </Box>

            {/* Initials (auto-generated but editable) */}
            <TextField
              label="Initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 8 } }}
              helperText="Auto-generated from name. Shown in list views for privacy."
              placeholder="JD"
              disabled={isDisabled}
            />

            {/* Date of Birth */}
            <TextField
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                clearFieldError("dob");
              }}
              onBlur={() => handleFieldBlur("dob", dob)}
              error={!!fieldErrors.dob}
              helperText={fieldErrors.dob}
              required
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
              disabled={isDisabled}
            />

            {/* Site Dropdown */}
            <FormControl
              fullWidth
              required
              disabled={isDisabled || locationsLoading}
              error={!!fieldErrors.siteId}
            >
              <InputLabel>Site *</InputLabel>
              <Select
                value={siteId}
                label="Site *"
                onChange={(e) => {
                  setSiteId(e.target.value);
                  clearFieldError("siteId");
                }}
              >
                {locationsLoading && (
                  <MenuItem value="" disabled>
                    Loading sites...
                  </MenuItem>
                )}
                {(locations ?? []).map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} ({location.type.replace("_", " ")})
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.siteId && <FormHelperText>{fieldErrors.siteId}</FormHelperText>}
            </FormControl>

            {/* Current School */}
            <TextField
              label="Current School"
              value={currentSchool}
              onChange={(e) => setCurrentSchool(e.target.value)}
              fullWidth
              placeholder="Enter current school name"
              disabled={isDisabled}
            />

            <FormControl fullWidth disabled={isDisabled}>
              <InputLabel>Hearing Devices</InputLabel>
              <Select
                multiple
                value={hearingDevices}
                label="Hearing Devices"
                onChange={(e) => setHearingDevices(e.target.value as string[])}
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

            {hearingDevices.includes("Other") && (
              <TextField
                label="Other Hearing Device"
                value={otherHearingDevice}
                onChange={(e) => setOtherHearingDevice(e.target.value)}
                fullWidth
                placeholder="Describe other device"
                disabled={isDisabled}
              />
            )}

            <FormControl fullWidth disabled={isDisabled}>
              <InputLabel>Hearing Loss Type</InputLabel>
              <Select
                value={hearingLossType}
                label="Hearing Loss Type"
                onChange={(e) => setHearingLossType(e.target.value)}
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

            {/* Guardian Summary */}
            <TextField
              label="Guardian Summary"
              value={guardianSummary}
              onChange={(e) => setGuardianSummary(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief summary of guardians/family situation"
              disabled={isDisabled}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isDisabled}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={mutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={!isValid || isDisabled}
          >
            {mutation.isPending ? "Creating..." : "Create Student"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
