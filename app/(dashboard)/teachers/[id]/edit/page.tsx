"use client";

import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
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
import { use, useEffect, useState } from "react";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { FormSkeleton } from "@/client/components/skeletons";
import { useToast } from "@/client/components/ToastProvider";
import { listAllLocations } from "@/client/locations";
import {
  AGE_GROUP_LABELS,
  type AgeGroupSpecialty,
  getTeacherDetails,
  updateTeacher,
} from "@/client/teachers";

type FormData = {
  primary_site_id: string;
  bio: string;
  qualifications: string;
  credentials: string;
  age_group_specialty: AgeGroupSpecialty | "";
};

export default function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing teacher data
  const {
    data: teacher,
    isLoading: teacherLoading,
    error: teacherError,
  } = useQuery({
    queryKey: ["teachers", "show", id],
    queryFn: () => getTeacherDetails(id),
    enabled: !!id,
  });

  // Fetch locations for dropdown
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
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
    mutationFn: (payload: Parameters<typeof updateTeacher>[0]) => updateTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher updated successfully");
      router.push(`/teachers/${id}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update teacher. Please try again.");
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
              [field]: (event.target as { value: unknown }).value as string,
            }
          : null,
      );
      setError(null);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !id) return;

    const payload: Parameters<typeof updateTeacher>[0] = {
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
      <PageContainer maxWidth="md">
        <FormSkeleton fields={6} maxWidth={800} />
      </PageContainer>
    );
  }

  if (teacherError || !teacher) {
    return (
      <PageContainer maxWidth="md">
        <ErrorAlert message={teacherError ? "Failed to load teacher." : "Teacher not found."} />
      </PageContainer>
    );
  }

  if (!formData) {
    return (
      <PageContainer maxWidth="md">
        <FormSkeleton fields={4} maxWidth={800} />
      </PageContainer>
    );
  }

  const activeLocations = locations?.filter((loc) => loc.is_active) || [];

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Edit Teacher"
        subtitle={`${teacher.user.name} - ${teacher.user.email}`}
        back={`/teachers/${id}`}
        breadcrumbs={[
          { label: "Teachers", href: "/teachers" },
          { label: teacher.user.name, href: `/teachers/${id}` },
          { label: "Edit" },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <SectionCard>
            <Alert severity="info">
              To change the teacher&apos;s name, email, or phone, go to{" "}
              <Button
                size="small"
                onClick={() => router.push(`/users/${teacher.user_id}`)}
                sx={{ textTransform: "none", p: 0, minWidth: "auto" }}
              >
                User Management
              </Button>
            </Alert>
          </SectionCard>

          <SectionCard title="Assignment">
            <Stack spacing={3}>
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
            </Stack>
          </SectionCard>

          <SectionCard title="Profile Information">
            <Stack spacing={3}>
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
            </Stack>
          </SectionCard>

          {/* Submit Button */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={() => router.push(`/teachers/${id}`)}>
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
