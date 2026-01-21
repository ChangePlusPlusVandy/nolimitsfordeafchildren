import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import { useUserHttpService, type UserRole, type InviteUserInput } from "../services/UserHttpService";

export default function InviteUserModal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userHttpService = useUserHttpService();

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [phone, setPhone] = useState("");

  const mutation = useMutation({
    mutationFn: (data: InviteUserInput) => userHttpService.mutations.invite(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key] });
      navigate(`/users/${user.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      email,
      name,
      role,
      phone: phone || undefined,
    });
  };

  const isValid = email.trim() && name.trim();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/users")}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Invite User
        </Typography>
      </Box>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(mutation.error as Error)?.message || "Failed to invite user. Please try again."}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the details for the new user. They will receive an email invitation to set up their account.
            </Typography>

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="user@example.com"
            />

            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              placeholder="John Doe"
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="administrator">Administrator</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              placeholder="555-123-4567"
            />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
              <Button onClick={() => navigate("/users")}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={mutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={!isValid || mutation.isPending}
              >
                Send Invitation
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
