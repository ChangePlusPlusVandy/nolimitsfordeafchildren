import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useHttpClient } from "../../../plugins/axios";
import { useAuth } from "../../../auth";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  locale: string;
  role: "administrator" | "teacher" | "parent";
  is_active: boolean;
  created_at: string;
}

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  locale?: string;
}

export default function MyProfilePage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile
  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/me");
      return response.data;
    },
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setLocale(profile.locale);
    }
  }, [profile]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await httpClient.patch("/v1/me", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name,
      phone: phone || undefined,
      locale,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setLocale(profile.locale);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load profile. Please try again.
      </Alert>
    );
  }

  const displayProfile = profile || {
    name: authUser?.name || "User",
    email: authUser?.email || "",
    role: authUser?.role || "parent",
    phone: "",
    locale: "en-US",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Profile
        </Typography>
        {!isEditing ? (
          <Button variant="outlined" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>

      {/* Status chips */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <Chip
          label={displayProfile.role}
          color={
            displayProfile.role === "administrator"
              ? "primary"
              : displayProfile.role === "teacher"
              ? "secondary"
              : "success"
          }
          sx={{ textTransform: "capitalize" }}
        />
        <Chip
          label={displayProfile.is_active ? "Active" : "Disabled"}
          color={displayProfile.is_active ? "success" : "default"}
          variant={displayProfile.is_active ? "filled" : "outlined"}
        />
      </Box>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to update profile. Please try again.
        </Alert>
      )}

      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully.
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Name"
            value={isEditing ? name : displayProfile.name}
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setPhone(e.target.value)}
            disabled={!isEditing}
            fullWidth
            placeholder="555-123-4567"
          />

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Locale</InputLabel>
            <Select
              value={isEditing ? locale : displayProfile.locale}
              label="Locale"
              onChange={(e) => setLocale(e.target.value)}
            >
              <MenuItem value="en-US">English (US)</MenuItem>
              <MenuItem value="es-ES">Spanish</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Role: <strong style={{ textTransform: "capitalize" }}>{displayProfile.role}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contact an administrator to change your role
            </Typography>
          </Box>

          <Typography variant="subtitle2" color="text.secondary">
            Member since: {new Date(displayProfile.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
