"use client";

import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ConfirmDialog from "@/client/components/ConfirmDialog";
import { useToast } from "@/client/components/ToastProvider";
import { getStudentDetails, linkParentToStudent, unlinkParentFromStudent } from "@/client/students";
import { listUsers } from "@/client/users";

interface LinkParentModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

export default function LinkParentModal({
  open,
  onClose,
  studentId,
  studentName,
}: LinkParentModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedParent, setSelectedParent] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [relationship, setRelationship] = useState<string>("mother");
  const [isPrimary, setIsPrimary] = useState(false);
  const [unlinkParentId, setUnlinkParentId] = useState<string | null>(null);

  // Fetch student details to show current linked parents
  const {
    data: student,
    isLoading: studentLoading,
    isError: studentError,
  } = useQuery({
    queryKey: ["students", "show", studentId],
    queryFn: () => getStudentDetails(studentId),
    enabled: open && !!studentId,
  });

  // Fetch all parents for the dropdown
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["users", "index", { role: "parent" }],
    queryFn: () => listUsers({ role: "parent", limit: 500 }),
    enabled: open,
  });

  const parents = usersData?.items ?? [];

  // Filter out already linked parents
  const linkedParentUserIds = student?.parents?.map((p) => p.user_id) || [];
  const availableParents = parents.filter((p) => !linkedParentUserIds.includes(p.id));

  // Link parent mutation
  const linkMutation = useMutation({
    mutationFn: (data: {
      studentId: string;
      parent_id: string;
      relationship?: string;
      is_primary?: boolean;
    }) => linkParentToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      toast.success("Parent linked successfully");
      setSelectedParent(null);
      setRelationship("mother");
      setIsPrimary(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to link parent");
    },
  });

  // Unlink parent mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ studentId, parentId }: { studentId: string; parentId: string }) =>
      unlinkParentFromStudent({ studentId, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      toast.success("Parent unlinked successfully");
      setUnlinkParentId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to unlink parent");
      setUnlinkParentId(null);
    },
  });

  const handleLinkParent = () => {
    if (selectedParent && studentId) {
      linkMutation.mutate({
        studentId,
        parent_id: selectedParent.id,
        relationship,
        is_primary: isPrimary,
      });
    }
  };

  const handleUnlinkParent = (parentId: string) => {
    setUnlinkParentId(parentId);
  };

  const handleClose = () => {
    setSelectedParent(null);
    setRelationship("mother");
    setIsPrimary(false);
    setUnlinkParentId(null);
    onClose();
  };

  const isLoading = studentLoading || usersLoading;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Link Parent
          {studentName && (
            <Typography variant="body2" color="text.secondary">
              for {studentName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {(studentError || usersError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load data. Please try again.
            </Alert>
          )}

          {/* Add Parent Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Search and select a parent to link
            </Typography>

            <Stack spacing={2}>
              <Autocomplete
                value={selectedParent}
                onChange={(_, newValue) => setSelectedParent(newValue)}
                options={availableParents}
                getOptionLabel={(option) => option.name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={usersLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Parents"
                    placeholder="Type to search..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "warning.main" }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={relationship}
                    label="Relationship"
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    <MenuItem value="mother">Mother</MenuItem>
                    <MenuItem value="father">Father</MenuItem>
                    <MenuItem value="guardian">Guardian</MenuItem>
                    <MenuItem value="grandmother">Grandmother</MenuItem>
                    <MenuItem value="grandfather">Grandfather</MenuItem>
                    <MenuItem value="aunt">Aunt</MenuItem>
                    <MenuItem value="uncle">Uncle</MenuItem>
                    <MenuItem value="foster_parent">Foster Parent</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Primary"
                />
              </Box>

              <Button
                variant="contained"
                startIcon={linkMutation.isPending ? <CircularProgress size={16} /> : <LinkIcon />}
                onClick={handleLinkParent}
                disabled={!selectedParent || linkMutation.isPending}
              >
                Link Parent
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Currently Linked Parents */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Currently Linked Parents ({student?.parents?.length || 0})
            </Typography>

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : student?.parents && student.parents.length > 0 ? (
              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {student.parents.map((parent) => (
                  <ListItem
                    key={parent.link_id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        size="small"
                        onClick={() => handleUnlinkParent(parent.parent_id)}
                        disabled={unlinkMutation.isPending}
                        aria-label={`Unlink parent ${parent.name}`}
                      >
                        <LinkOffIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "warning.main" }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {parent.name}
                          {parent.is_primary && (
                            <Chip label="Primary" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {parent.relationship && `${parent.relationship} - `}
                          {parent.email}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                No parents currently linked.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Done</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!unlinkParentId}
        title="Unlink parent?"
        message="Are you sure you want to unlink this parent from the student?"
        confirmLabel="Unlink"
        confirmColor="error"
        loading={unlinkMutation.isPending}
        onConfirm={() => {
          if (unlinkParentId) unlinkMutation.mutate({ studentId, parentId: unlinkParentId });
        }}
        onCancel={() => setUnlinkParentId(null)}
      />
    </>
  );
}
