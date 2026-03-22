import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonIcon from "@mui/icons-material/Person";
import { useStudentHttpService, type LinkParentInput } from "../services/StudentHttpService";
import { useUserHttpService } from "../../users/services/UserHttpService";
import { useToast } from "../../global/components/ToastProvider";

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
  const studentHttpService = useStudentHttpService();
  const userHttpService = useUserHttpService();
  const toast = useToast();

  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [relationship, setRelationship] = useState<string>("mother");
  const [isPrimary, setIsPrimary] = useState(false);

  // Fetch student details to show current linked parents
  const {
    data: student,
    isLoading: studentLoading,
    isError: studentError,
  } = useQuery({
    queryKey: [studentHttpService.key, "show", studentId],
    queryFn: () => studentHttpService.queries.show(studentId),
    enabled: open && !!studentId,
  });

  // Fetch all parents for the dropdown
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: [userHttpService.key, "index", { role: "parent" }],
    queryFn: () => userHttpService.queries.index({ role: "parent", limit: 500 }),
    enabled: open,
  });

  const parents = usersData?.items || [];

  // Filter out already linked parents
  const linkedParentUserIds = student?.parents?.map((p) => p.user_id) || [];
  const availableParents = parents.filter((p: any) => !linkedParentUserIds.includes(p.id));

  // Link parent mutation
  const linkMutation = useMutation({
    mutationFn: (data: LinkParentInput & { studentId: string }) =>
      studentHttpService.mutations.linkParent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
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
      studentHttpService.mutations.unlinkParent({ studentId, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
      toast.success("Parent unlinked successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to unlink parent");
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
    if (studentId && confirm("Are you sure you want to unlink this parent?")) {
      unlinkMutation.mutate({ studentId, parentId });
    }
  };

  const handleClose = () => {
    setSelectedParent(null);
    setRelationship("mother");
    setIsPrimary(false);
    onClose();
  };

  const isLoading = studentLoading || usersLoading;

  return (
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
              getOptionLabel={(option: any) => option.name || ""}
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
                        {parent.is_primary && <Chip label="Primary" size="small" color="primary" />}
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
      <DialogActions>
        <Button onClick={handleClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
