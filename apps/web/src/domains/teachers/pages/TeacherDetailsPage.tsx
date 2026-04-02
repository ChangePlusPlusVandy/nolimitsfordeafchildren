import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import {
  useTeacherHttpService,
  decodeDayMask,
  AGE_GROUP_LABELS,
  type AgeGroupSpecialty,
} from "../services/TeacherHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useAuth } from "../../../auth";

export default function TeacherDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teacherHttpService = useTeacherHttpService();
  const locationHttpService = useLocationHttpService();
  const { isAdmin } = useAuth();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const {
    data: teacher,
    isLoading,
    error,
  } = useQuery({
    queryKey: [teacherHttpService.key, "show", id],
    queryFn: () => teacherHttpService.queries.show(id!),
    enabled: !!id,
  });

  const { data: assignedLocations = [] } = useQuery({
    queryKey: [teacherHttpService.key, "locations", id],
    queryFn: () => teacherHttpService.queries.getLocations(id!),
    enabled: !!id && isAdmin,
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
    enabled: isAdmin,
  });

  const assignLocationMutation = useMutation({
    mutationFn: teacherHttpService.mutations.assignLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "locations", id] });
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "show", id] });
      setIsAssignDialogOpen(false);
      setSelectedLocationId("");
    },
  });

  const unassignLocationMutation = useMutation({
    mutationFn: teacherHttpService.mutations.unassignLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "locations", id] });
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "show", id] });
    },
  });

  const availableLocations = useMemo(
    () => allLocations.filter((location) => !assignedLocations.some((assigned) => assigned.id === location.id)),
    [allLocations, assignedLocations],
  );

  const handleAssignLocation = () => {
    if (!id || !selectedLocationId || assignLocationMutation.isPending) {
      return;
    }

    assignLocationMutation.mutate({
      teacherId: id,
      locationId: selectedLocationId,
    });
  };

  const handleLocationSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedLocationId((event.target as { value: string }).value);
  };

  const handleUnassignLocation = (locationId: string) => {
    if (!id || unassignLocationMutation.isPending) {
      return;
    }

    unassignLocationMutation.mutate({
      teacherId: id,
      locationId,
    });
  };

  if (isLoading) {
    return <DetailPageSkeleton sections={2} />;
  }

  if (error || !teacher) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load teacher details. Please try again.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours!, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {teacher.user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teacher.user.email}
            </Typography>
          </Box>
        </Box>
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/teachers/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/teachers/${id}/schedules/new`)}
            >
              Add Schedule
            </Button>
          </Box>
        )}
      </Box>

      {/* Profile Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
          <Avatar
            src={teacher.photo_url || undefined}
            sx={{ width: 100, height: 100, bgcolor: "primary.main" }}
          >
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography variant="h5">{teacher.user.name}</Typography>
              {teacher.age_group_specialty && (
                <Chip
                  label={AGE_GROUP_LABELS[teacher.age_group_specialty as AgeGroupSpecialty]}
                  color="primary"
                  size="small"
                />
              )}
              <Chip
                label={teacher.user.is_active ? "Active" : "Inactive"}
                color={teacher.user.is_active ? "success" : "default"}
                size="small"
              />
            </Box>

            {teacher.primarySite && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Primary Site: {teacher.primarySite.name}
              </Typography>
            )}

            {teacher.bio && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bio
                </Typography>
                <Typography variant="body1">{teacher.bio}</Typography>
              </Box>
            )}

            {teacher.qualifications && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Qualifications
                </Typography>
                <Typography variant="body1">{teacher.qualifications}</Typography>
              </Box>
            )}

            {teacher.credentials && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Credentials
                </Typography>
                <Typography variant="body1">{teacher.credentials}</Typography>
              </Box>
            )}

            {teacher.user.phone && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{teacher.user.phone}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Schedules Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<ScheduleIcon />}
          title="Schedules"
          subheader={`${teacher.schedules.length} schedule(s)`}
          action={
            isAdmin && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => navigate(`/teachers/${id}/schedules/new`)}
              >
                Add
              </Button>
            )
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {teacher.schedules.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">No schedules assigned</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {teacher.schedules.map((schedule, idx) => (
                <Box key={schedule.id}>
                  {idx > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body1">
                            {decodeDayMask(schedule.day_of_week_mask).join("/")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </Typography>
                          {!schedule.is_active && (
                            <Chip label="Inactive" size="small" variant="outlined" />
                          )}
                          {schedule.session?.name && (
                            <Chip label={schedule.session.name} size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.site.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cycle: {schedule.cycle_start_date} to {schedule.cycle_end_date}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton component={Link} to={`/schedules/${schedule.id}`} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Assigned Locations Section */}
      {isAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            avatar={<AddLocationAltIcon />}
            title="Assigned Locations"
            subheader={`${assignedLocations.length} location(s)`}
            action={
              <Button
                startIcon={<AddIcon />}
                onClick={() => setIsAssignDialogOpen(true)}
                disabled={availableLocations.length === 0}
              >
                Assign Location
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            {assignedLocations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">No locations assigned</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {assignedLocations.map((location, idx) => (
                  <Box key={location.id}>
                    {idx > 0 && <Divider />}
                    <ListItem>
                      <ListItemText primary={location.name} />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUnassignLocation(location.id)}
                          disabled={unassignLocationMutation.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assigned Students Section */}
      <Card>
        <CardHeader
          avatar={<SchoolIcon />}
          title="Assigned Students"
          subheader={`${teacher.students.length} student(s)`}
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {teacher.students.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">No students assigned</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {teacher.students.map((student, idx) => (
                <Box key={student.id}>
                  {idx > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        isAdmin ? `${student.first_name} ${student.last_name}` : student.initials
                      }
                      secondary={student.site.name}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        component={Link}
                        to={
                          isAdmin ? `/students/${student.id}` : `/teachers/students/${student.id}`
                        }
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isAssignDialogOpen}
        onClose={() => {
          if (assignLocationMutation.isPending) return;
          setIsAssignDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Location</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="assign-location-label">Location</InputLabel>
            <Select
              labelId="assign-location-label"
              value={selectedLocationId}
              label="Location"
              onChange={handleLocationSelectChange}
            >
              {availableLocations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAssignDialogOpen(false)}
            disabled={assignLocationMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignLocation}
            variant="contained"
            disabled={!selectedLocationId || assignLocationMutation.isPending}
            startIcon={assignLocationMutation.isPending ? <CircularProgress size={16} /> : undefined}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
