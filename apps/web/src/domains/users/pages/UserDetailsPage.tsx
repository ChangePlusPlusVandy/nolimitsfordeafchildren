import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import ConfirmDialog from "../../global/components/ConfirmDialog";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import { formatDateTime, formatDate } from "../../../utils/formatDate";
import {
  useUserHttpService,
  type UserRole,
  type UpdateUserInput,
} from "../services/UserHttpService";
import { useToast } from "../../global/components/ToastProvider";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const userHttpService = useUserHttpService();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [isEditing, setIsEditing] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState<string | null>(null);
  const [linkStudentDialogOpen, setLinkStudentDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linkRelationship, setLinkRelationship] = useState("");

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [userHttpService.key, "show", id],
    queryFn: () => userHttpService.queries.show(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setPhotoUrl(user.photo_url || "");
      setRole(user.role);
    }
  }, [user]);

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

  const { data: availableStudents } = useQuery({
    queryKey: [userHttpService.key, "students-for-link", id],
    queryFn: () => userHttpService.queries.students({ page: 1, limit: 200 }),
    enabled: user?.role === "parent",
  });

  const linkStudentMutation = useMutation({
    mutationFn: () =>
      userHttpService.mutations.linkStudent({
        userId: id!,
        studentId: selectedStudentId,
        relationship: linkRelationship.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key, "show", id] });
      setLinkStudentDialogOpen(false);
      setSelectedStudentId("");
      setLinkRelationship("");
      toast.success("Student linked to parent");
    },
    onError: () => {
      toast.error("Failed to link student");
    },
  });

  const unlinkStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      userHttpService.mutations.unlinkStudent({ userId: id!, studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userHttpService.key, "show", id] });
      setShowUnlinkDialog(null);
      toast.success("Student unlinked from parent");
    },
    onError: () => {
      toast.error("Failed to unlink student");
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

  const roleLabel = (value: UserRole): string => {
    if (value === "parent") return "Parent/Guardian";
    if (value === "unassigned") return "Pending Approval";
    return value;
  };

  const breadcrumbs = [
    { label: "Users", href: "/users" },
    { label: user?.name ?? "User Details" },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <DetailPageSkeleton />
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <PageHeader title="User Details" back="/users" breadcrumbs={breadcrumbs} />
        <ErrorAlert
          message={error ? "Failed to load user." : "User not found."}
          onRetry={error ? () => refetch() : undefined}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={user.name}
        breadcrumbs={breadcrumbs}
        back="/users"
        actions={
          !isEditing ? (
            <Button variant="outlined" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
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

      {/* Status chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip
          label={roleLabel(user.role)}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
        <Chip
          label={user.is_active ? "Active" : "Disabled"}
          color={user.is_active ? "success" : "default"}
          variant={user.is_active ? "filled" : "outlined"}
        />
      </Stack>

      <Stack spacing={3}>
        {/* Profile section */}
        <SectionCard title="Profile">
          <Stack spacing={3}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                src={(isEditing ? photoUrl : user.photo_url) || undefined}
                sx={{ width: 72, height: 72 }}
              >
                {user.name.charAt(0)}
              </Avatar>
            </Box>

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
                <MenuItem value="parent">Parent/Guardian</MenuItem>
                <MenuItem value="unassigned">Pending Approval</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SectionCard>

        {/* Account status section */}
        <SectionCard title="Account Status">
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {user.is_active ? "User can log in and access the system." : "User cannot log in."}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Created: {formatDateTime(user.created_at)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatDateTime(user.updated_at)}
          </Typography>
        </SectionCard>

        {/* Linked students section (parents only) */}
        {user.role === "parent" && (
          <SectionCard
            title="Linked Students"
            actions={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setLinkStudentDialogOpen(true)}
              >
                Link Student
              </Button>
            }
          >
            {(user.linked_students ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No linked students.
              </Typography>
            ) : (
              <List dense disablePadding>
                {(user.linked_students ?? []).map((ls) => (
                  <ListItem
                    key={ls.link_id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        aria-label={`Unlink ${ls.first_name}`}
                        onClick={() => setShowUnlinkDialog(ls.student_id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`${ls.first_name} ${ls.last_name} (${ls.initials})`}
                      secondary={
                        ls.relationship
                          ? `${ls.relationship} \u2022 Linked ${formatDate(ls.linked_at)}`
                          : `Linked ${formatDate(ls.linked_at)}`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </SectionCard>
        )}
      </Stack>

      {/* Disable confirmation dialog */}
      <ConfirmDialog
        open={showDisableDialog}
        title="Disable User"
        message="Are you sure you want to disable this user? They will no longer be able to log in."
        confirmLabel="Disable"
        confirmColor="error"
        loading={disableMutation.isPending}
        onConfirm={() => disableMutation.mutate()}
        onCancel={() => setShowDisableDialog(false)}
      />

      {/* Unlink student confirmation */}
      <ConfirmDialog
        open={!!showUnlinkDialog}
        title="Unlink Student"
        message="Are you sure you want to unlink this student from the parent?"
        confirmLabel="Unlink"
        confirmColor="error"
        loading={unlinkStudentMutation.isPending}
        onConfirm={() => {
          if (showUnlinkDialog) unlinkStudentMutation.mutate(showUnlinkDialog);
        }}
        onCancel={() => setShowUnlinkDialog(null)}
      />

      {/* Link student dialog */}
      <Dialog open={linkStudentDialogOpen} onClose={() => setLinkStudentDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Link Student to Parent</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a student and optional relationship label.
          </DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudentId}
              label="Student"
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              {(availableStudents?.items ?? []).map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.first_name && student.last_name
                    ? `${student.first_name} ${student.last_name} (${student.initials})`
                    : student.initials}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Relationship (optional)"
            value={linkRelationship}
            onChange={(event) => setLinkRelationship(event.target.value)}
            fullWidth
            placeholder="Mother, Father, Guardian..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkStudentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => linkStudentMutation.mutate()}
            disabled={!selectedStudentId || linkStudentMutation.isPending}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
