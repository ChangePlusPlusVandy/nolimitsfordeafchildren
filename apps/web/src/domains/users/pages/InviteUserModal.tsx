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
      onClose();
    }
  };

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
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="user@example.com"
              disabled={mutation.isPending}
            />

            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
        <DialogActions>
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
