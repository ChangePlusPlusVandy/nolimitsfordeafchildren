import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router";
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import ConfirmDialog from "../../global/components/ConfirmDialog";
import { useToast } from "../../global/components/ToastProvider";
import { formatDate, formatTime } from "../../../utils/formatDate";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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
  const toast = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [unassignTarget, setUnassignTarget] = useState<string | null>(null);

  const {
    data: teacher,
    isLoading,
    error,
    refetch,
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
      toast.success("Location assigned");
    },
    onError: () => {
      toast.error("Failed to assign location");
    },
  });

  const unassignLocationMutation = useMutation({
    mutationFn: teacherHttpService.mutations.unassignLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "locations", id] });
      await queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "show", id] });
      setUnassignTarget(null);
      toast.success("Location unassigned");
    },
    onError: () => {
      toast.error("Failed to unassign location");
      setUnassignTarget(null);
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

  const handleConfirmUnassign = () => {
    if (!id || !unassignTarget || unassignLocationMutation.isPending) {
      return;
    }

    unassignLocationMutation.mutate({
      teacherId: id,
      locationId: unassignTarget,
    });
  };

  if (isLoading) {
    return <DetailPageSkeleton sections={2} />;
  }

  if (error || !teacher) {
    return (
      <PageContainer>
        <ErrorAlert message="Failed to load teacher details." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={teacher.user.name}
        subtitle={teacher.user.email}
        back="/teachers"
        breadcrumbs={[
          { label: "Teachers", href: "/teachers" },
          { label: teacher.user.name },
        ]}
        actions={
          isAdmin ? (
            <>
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
            </>
          ) : undefined
        }
      />

      <Stack spacing={3}>
      {/* Profile Section */}
      <SectionCard title="Profile" icon={<PersonIcon />}>
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
      </SectionCard>

      {/* Schedules Section */}
      <SectionCard
        title="Schedules"
        icon={<ScheduleIcon />}
        actions={
          isAdmin ? (
            <Button
              startIcon={<AddIcon />}
              onClick={() => navigate(`/teachers/${id}/schedules/new`)}
            >
              Add
            </Button>
          ) : undefined
        }
        noPadding
      >
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
                          Cycle: {formatDate(schedule.cycle_start_date)} to {formatDate(schedule.cycle_end_date)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      component={Link}
                      to={`/schedules/${schedule.id}`}
                      size="small"
                      endIcon={<ChevronRightIcon fontSize="small" />}
                      sx={{ textTransform: "none" }}
                    >
                      Open schedule
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </SectionCard>

      {/* Assigned Locations Section */}
      {isAdmin && (
        <SectionCard
          title="Assigned Locations"
          icon={<AddLocationAltIcon />}
          actions={
            <Button
              startIcon={<AddIcon />}
              onClick={() => setIsAssignDialogOpen(true)}
              disabled={availableLocations.length === 0}
            >
              Assign Location
            </Button>
          }
          noPadding
        >
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
                        aria-label="Unassign location"
                        onClick={() => setUnassignTarget(location.id)}
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
        </SectionCard>
      )}

      {/* Assigned Students Section */}
      <SectionCard
        title="Assigned Students"
        icon={<SchoolIcon />}
        noPadding
      >
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
                    <Button
                      component={Link}
                      to={
                        isAdmin ? `/students/${student.id}` : `/teachers/students/${student.id}`
                      }
                      size="small"
                      endIcon={<ChevronRightIcon fontSize="small" />}
                      sx={{ textTransform: "none" }}
                    >
                      View student
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </SectionCard>
      </Stack>

      {/* Assign Location Dialog */}
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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

      {/* Unassign Location Confirm Dialog */}
      <ConfirmDialog
        open={unassignTarget !== null}
        title="Unassign location?"
        message="This teacher will no longer be assigned to this location. You can reassign them later."
        confirmLabel="Unassign"
        confirmColor="error"
        loading={unassignLocationMutation.isPending}
        onConfirm={handleConfirmUnassign}
        onCancel={() => setUnassignTarget(null)}
      />
    </PageContainer>
  );
}
