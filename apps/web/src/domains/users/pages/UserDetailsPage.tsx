import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import {
  useUserHttpService,
  type UserRole,
  type UpdateUserInput,
} from "../services/UserHttpService";
import { useToast } from "../../global/components/ToastProvider";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userHttpService = useUserHttpService();
  const toast = useToast();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [isEditing, setIsEditing] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Fetch user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: [userHttpService.key, "show", id],
    queryFn: () => userHttpService.queries.show(id!),
    enabled: !!id,
  });

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setPhotoUrl(user.photo_url || "");
      setRole(user.role);
    }
  }, [user]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserInput & { id: string }) => userHttpService.mutations.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key] });
      setIsEditing(false);
      toast.success("User updated successfully");
    },
    onError: () => {
      toast.error("Failed to update user. Please try again.");
    },
  });

  // Disable mutation
  const disableMutation = useMutation({
    mutationFn: () => userHttpService.mutations.disable(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key] });
      setShowDisableDialog(false);
      toast.success("User has been disabled");
    },
    onError: () => {
      toast.error("Failed to disable user. Please try again.");
    },
  });

  // Enable mutation
  const enableMutation = useMutation({
    mutationFn: () => userHttpService.mutations.enable(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key] });
      toast.success("User has been enabled");
    },
    onError: () => {
      toast.error("Failed to enable user. Please try again.");
    },
  });

  const handleSave = () => {
    if (!id) return;
    updateMutation.mutate({
      id,
      name,
      email,
      phone: phone || undefined,
      photo_url: photoUrl || undefined,
      role,
    });
  };

  const handleToggleActive = () => {
    if (user?.is_active) {
      setShowDisableDialog(true);
    } else {
      enableMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width={80} height={36} />
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        {/* Status chips */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
        </Box>
        {/* Form skeleton */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
            <Skeleton variant="rectangular" height={1} />
            <Box>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="rounded" width={100} height={38} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/users")}>
          Back to Users
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error ? "Failed to load user" : "User not found"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={(isEditing ? photoUrl : user.photo_url) || undefined} sx={{ width: 56, height: 56 }}>
          {user.name.charAt(0)}
        </Avatar>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/users")}>
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          User Details
        </Typography>
        {!isEditing ? (
          <Button variant="outlined" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
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
          label={user.role}
          color={
            user.role === "administrator"
              ? "primary"
              : user.role === "teacher"
                ? "secondary"
                : "success"
          }
          sx={{ textTransform: "capitalize" }}
        />
        <Chip
          label={user.is_active ? "Active" : "Disabled"}
          color={user.is_active ? "success" : "default"}
          variant={user.is_active ? "filled" : "outlined"}
        />
      </Box>

      {/* User form */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Name"
            value={isEditing ? name : user.name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing}
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            value={isEditing ? email : user.email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing}
            fullWidth
          />

          <TextField
            label="Phone"
            value={isEditing ? phone : user.phone || ""}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!isEditing}
            fullWidth
          />

          <TextField
            label="Headshot URL"
            value={isEditing ? photoUrl : user.photo_url || ""}
            onChange={(e) => setPhotoUrl(e.target.value)}
            disabled={!isEditing}
            fullWidth
            placeholder="https://..."
          />

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Role</InputLabel>
            <Select
              value={isEditing ? role : user.role}
              label="Role"
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <MenuItem value="administrator">Administrator</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="parent">Parent</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Account Status
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={user.is_active}
                  onChange={handleToggleActive}
                  disabled={disableMutation.isPending || enableMutation.isPending}
                />
              }
              label={user.is_active ? "Active" : "Disabled"}
            />
            <Typography variant="body2" color="text.secondary">
              {user.is_active ? "User can log in and access the system" : "User cannot log in"}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Created: {new Date(user.created_at).toLocaleString()}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Last updated: {new Date(user.updated_at).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Disable confirmation dialog */}
      <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)}>
        <DialogTitle>Disable User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disable this user? They will no longer be able to log in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisableDialog(false)}>Cancel</Button>
          <Button
            onClick={() => disableMutation.mutate()}
            color="error"
            disabled={disableMutation.isPending}
          >
            Disable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
