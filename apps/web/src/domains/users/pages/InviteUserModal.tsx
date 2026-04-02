import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {
  useUserHttpService,
  type UserRole,
  type InviteUserInput,
} from "../services/UserHttpService";
import { useToast } from "../../global/components/ToastProvider";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ open, onClose }: InviteUserModalProps) {
  const queryClient = useQueryClient();
  const userHttpService = useUserHttpService();
  const toast = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
        return "";
      case "name":
        return value.trim() ? "" : "Name is required";
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

  const mutation = useMutation({
    mutationFn: (data: InviteUserInput) => userHttpService.mutations.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key] });
      toast.success("Invitation sent successfully");
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to invite user");
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      // Reset form state
      setEmail("");
      setName("");
      setRole("parent");
      setPhone("");
      setFieldErrors({});
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    errors.email = validateField("email", email);
    errors.name = validateField("name", name);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    mutation.mutate({
      email,
      name,
      role,
      phone: phone || undefined,
    });
  };

  const isValid = email.trim() && name.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the details for the new user. They will receive an email invitation to set up
              their account.
            </Typography>

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              onBlur={() => handleFieldBlur("email", email)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              required
              fullWidth
              autoFocus
              placeholder="user@example.com"
              disabled={mutation.isPending}
            />

            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
              onBlur={() => handleFieldBlur("name", name)}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              required
              fullWidth
              placeholder="John Doe"
              disabled={mutation.isPending}
            />

            <FormControl fullWidth disabled={mutation.isPending}>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <MenuItem value="unassigned">Pending Approval</MenuItem>
                <MenuItem value="parent">Parent/Guardian</MenuItem>
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
              disabled={mutation.isPending}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={mutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
