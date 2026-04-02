import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  TextField,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import { formatDate } from "../../../utils/formatDate";
import { useHttpClient } from "../../../plugins/axios";
import { useAuth } from "../../../auth";
import { useToast } from "../../global/components/ToastProvider";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: "administrator" | "teacher" | "parent" | "unassigned";
  is_active: boolean;
  created_at: string;
  parentAddress?: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

function getEventValue(event: unknown): string {
  return ((event as any)?.target?.value ?? "") as string;
}

export default function MyProfilePage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [nameError, setNameError] = useState("");

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/me");
      return response.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setPhotoUrl(profile.photo_url || "");
      setLocale(profile.locale);
      setAddressLine1(profile.parentAddress?.address_line1 || "");
      setAddressLine2(profile.parentAddress?.address_line2 || "");
      setCity(profile.parentAddress?.city || "");
      setState(profile.parentAddress?.state || "");
      setPostalCode(profile.parentAddress?.postal_code || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await httpClient.patch("/v1/me", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    setIsEditing(false);
    setNameError("");
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile. Please try again.");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    updateMutation.mutate({
      name,
      phone: phone || undefined,
      photo_url: photoUrl || undefined,
      locale,
      ...(displayProfile.role === "parent"
        ? {
            address_line1: addressLine1 || undefined,
            address_line2: addressLine2 || undefined,
            city: city || undefined,
            state: state || undefined,
            postal_code: postalCode || undefined,
          }
        : {}),
    });
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setPhotoUrl(profile.photo_url || "");
      setLocale(profile.locale);
      setAddressLine1(profile.parentAddress?.address_line1 || "");
      setAddressLine2(profile.parentAddress?.address_line2 || "");
      setCity(profile.parentAddress?.city || "");
      setState(profile.parentAddress?.state || "");
      setPostalCode(profile.parentAddress?.postal_code || "");
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="md">
        <DetailPageSkeleton />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="md">
        <PageHeader title="My Profile" />
        <ErrorAlert message="Failed to load profile." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const displayProfile = profile || {
    name: authUser?.name || "User",
    email: authUser?.email || "",
    role: authUser?.role || "unassigned",
    phone: "",
    photo_url: "",
    locale: "en-US",
    is_active: true,
    created_at: new Date().toISOString(),
    parentAddress: null,
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="My Profile"
        actions={
          !isEditing ? (
            <Button variant="outlined" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </Stack>
          )
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip
          label={displayProfile.role}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
        <Chip
          label={displayProfile.is_active ? "Active" : "Disabled"}
          color={displayProfile.is_active ? "success" : "default"}
          variant={displayProfile.is_active ? "filled" : "outlined"}
        />
      </Stack>

      <Stack spacing={3}>
        <SectionCard title="Personal Information">
          <Stack spacing={3}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                src={(isEditing ? photoUrl : displayProfile.photo_url) || undefined}
                sx={{ width: 80, height: 80 }}
              >
                {displayProfile.name.charAt(0)}
              </Avatar>
            </Box>

            <TextField
              label="Name"
              value={isEditing ? name : displayProfile.name}
              onChange={(e) => { setName(getEventValue(e)); if (nameError) setNameError(""); }}
              onBlur={() => { if (isEditing && !name.trim()) setNameError("Name is required"); }}
              error={isEditing && !!nameError}
              helperText={isEditing ? nameError : undefined}
              disabled={!isEditing}
              fullWidth
            />
            <TextField
              label="Email"
              value={displayProfile.email}
              disabled
              fullWidth
              helperText="Contact an administrator to change your email"
            />
            <TextField
              label="Phone"
              value={isEditing ? phone : displayProfile.phone || ""}
              onChange={(e) => setPhone(getEventValue(e))}
              disabled={!isEditing}
              fullWidth
              placeholder="555-123-4567"
            />
            <TextField
              label="Headshot URL"
              value={isEditing ? photoUrl : displayProfile.photo_url || ""}
              onChange={(e) => setPhotoUrl(e.target.value)}
              disabled={!isEditing}
              fullWidth
              placeholder="https://..."
            />
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Locale</InputLabel>
              <Select
                value={isEditing ? locale : displayProfile.locale}
                label="Locale"
                onChange={(e) => setLocale(getEventValue(e))}
              >
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="es-ES">Spanish</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SectionCard>

        {displayProfile.role === "parent" && (
          <SectionCard title="Address">
            <Stack spacing={3}>
              <TextField
                label="Address Line 1"
                value={isEditing ? addressLine1 : displayProfile.parentAddress?.address_line1 || ""}
                onChange={(e) => setAddressLine1(getEventValue(e))}
                disabled={!isEditing}
                fullWidth
              />
              <TextField
                label="Address Line 2"
                value={isEditing ? addressLine2 : displayProfile.parentAddress?.address_line2 || ""}
                onChange={(e) => setAddressLine2(getEventValue(e))}
                disabled={!isEditing}
                fullWidth
              />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="City"
                  value={isEditing ? city : displayProfile.parentAddress?.city || ""}
                  onChange={(e) => setCity(getEventValue(e))}
                  disabled={!isEditing}
                  fullWidth
                />
                <TextField
                  label="State"
                  value={isEditing ? state : displayProfile.parentAddress?.state || ""}
                  onChange={(e) => setState(getEventValue(e))}
                  disabled={!isEditing}
                  fullWidth
                />
                <TextField
                  label="ZIP Code"
                  value={isEditing ? postalCode : displayProfile.parentAddress?.postal_code || ""}
                  onChange={(e) => setPostalCode(getEventValue(e))}
                  disabled={!isEditing}
                  fullWidth
                />
              </Box>
            </Stack>
          </SectionCard>
        )}

        <SectionCard title="Account">
          <Typography variant="body2" color="text.secondary">
            Role: <strong style={{ textTransform: "capitalize" }}>{displayProfile.role}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Contact an administrator to change your role.
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            Member since {formatDate(displayProfile.created_at)}
          </Typography>
        </SectionCard>
      </Stack>
    </PageContainer>
  );
}
