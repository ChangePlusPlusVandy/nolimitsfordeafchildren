import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonIcon from "@mui/icons-material/Person";
import { useStudentHttpService, type LinkParentInput } from "../services/StudentHttpService";
import { useUserHttpService } from "../../users/services/UserHttpService";

export default function LinkParentModal() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const userHttpService = useUserHttpService();

  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [relationship, setRelationship] = useState<string>("mother");
  const [isPrimary, setIsPrimary] = useState(false);

  // Fetch student details to show current linked parents
  const { data: student, isLoading: studentLoading, isError: studentError } = useQuery({
    queryKey: [studentHttpService.key, "show", studentId],
    queryFn: () => studentHttpService.queries.show(studentId!),
    enabled: !!studentId,
  });

  // Fetch all parents for the dropdown
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: [userHttpService.key, "index", { role: "parent" }],
    queryFn: () => userHttpService.queries.index({ role: "parent", limit: 500 }),
  });

  const parents = usersData?.items || [];

  // Filter out already linked parents
  const linkedParentUserIds = student?.parents?.map((p) => p.user_id) || [];
  const availableParents = parents.filter(
    (p: any) => !linkedParentUserIds.includes(p.id)
  );

  // Link parent mutation
  const linkMutation = useMutation({
    mutationFn: (data: LinkParentInput & { studentId: string }) =>
      studentHttpService.mutations.linkParent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
      setSelectedParent(null);
      setRelationship("mother");
      setIsPrimary(false);
    },
  });

  // Unlink parent mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ studentId, parentId }: { studentId: string; parentId: string }) =>
      studentHttpService.mutations.unlinkParent({ studentId, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
    },
  });

  const handleLinkParent = () => {
    if (selectedParent && studentId) {
      // We need to get the parent profile ID, not the user ID
      // For now, we'll pass the user ID and handle it in the backend
      linkMutation.mutate({
        studentId,
        parent_id: selectedParent.id, // This is the user ID, backend will find parent profile
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

  const isLoading = studentLoading || usersLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Link Parent
        </Typography>
      </Box>

      {(linkMutation.isError || unlinkMutation.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {((linkMutation.error || unlinkMutation.error) as Error)?.message ||
            "An error occurred. Please try again."}
        </Alert>
      )}

      {(studentError || usersError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load data. Please refresh the page.
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Add Parent Section */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            <LinkIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Add Parent
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search and select a parent to link to this student.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "warning.main" }}>
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

            <FormControl fullWidth>
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
                />
              }
              label="Primary Contact"
            />

            <Button
              variant="contained"
              startIcon={linkMutation.isPending ? <CircularProgress size={20} /> : <LinkIcon />}
              onClick={handleLinkParent}
              disabled={!selectedParent || linkMutation.isPending}
              fullWidth
            >
              Link Parent
            </Button>
          </Box>
        </Paper>

        {/* Currently Linked Parents */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Currently Linked Parents
          </Typography>

          {student?.parents && student.parents.length > 0 ? (
            <List>
              {student.parents.map((parent) => (
                <ListItem
                  key={parent.link_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleUnlinkParent(parent.parent_id)}
                      disabled={unlinkMutation.isPending}
                    >
                      <LinkOffIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "warning.main" }}>
                      <PersonIcon />
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
                        {parent.relationship && (
                          <Typography variant="caption" display="block">
                            {parent.relationship}
                          </Typography>
                        )}
                        {parent.email}
                        {parent.phone && ` - ${parent.phone}`}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Linked: {new Date(parent.linked_at).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No parents currently linked to this student.
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
