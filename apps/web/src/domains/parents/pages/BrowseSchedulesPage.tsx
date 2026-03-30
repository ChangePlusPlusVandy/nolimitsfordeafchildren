import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Alert,
  Skeleton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import type { ChangeEvent } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useParentHttpService } from "../services/ParentHttpService";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";

interface AvailableSchedule {
  id: string;
  teacher: {
    id: string;
    name: string;
    age_group_specialty: string | null;
  };
  site: {
    id: string;
    name: string;
  };
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  enrollment_count?: number;
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getDaysFromMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 1) days.push("Mon");
  if (mask & 2) days.push("Tue");
  if (mask & 4) days.push("Wed");
  if (mask & 8) days.push("Thu");
  if (mask & 16) days.push("Fri");
  if (mask & 32) days.push("Sat");
  if (mask & 64) days.push("Sun");
  return days;
}

function getDayPattern(mask: number): string {
  const days = getDaysFromMask(mask);
  return days.join("/");
}

function formatAgeGroup(specialty: string | null): string {
  if (!specialty) return "All Ages";
  return specialty.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function ScheduleCard({
  schedule,
  selected,
  onSelect,
}: {
  schedule: AvailableSchedule;
  selected: boolean;
  onSelect: (schedule: AvailableSchedule) => void;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: selected ? 2 : 1,
        borderColor: selected ? "primary.main" : "divider",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
          borderColor: "primary.light",
        },
      }}
    >
      <CardActionArea onClick={() => onSelect(schedule)} sx={{ height: "100%" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                {schedule.teacher.name}
              </Typography>
            </Stack>

            <Chip
              label={formatAgeGroup(schedule.teacher.age_group_specialty)}
              size="small"
              variant="outlined"
              color="primary"
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {schedule.site.name}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon color="action" fontSize="small" />
              <Typography variant="body2">{getDayPattern(schedule.day_of_week_mask)}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </Typography>
            </Stack>

            {selected && <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            flex: "1 1 280px",
            maxWidth: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.33% - 10px)" },
          }}
        >
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rounded" width={100} height={24} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="70%" />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

export default function BrowseSchedulesPage() {
  const navigate = useNavigate();
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const parentHttpService = useParentHttpService();
  const { showToast } = useToast();

  // State
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [dayPatternFilter, setDayPatternFilter] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<AvailableSchedule | null>(null);
  const [reason, setReason] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch linked children
  const { data: childrenData, isLoading: childrenLoading } = useQuery({
    queryKey: [parentHttpService.key, "myChildren"],
    queryFn: parentHttpService.queries.myChildren,
  });

  // Fetch available schedules
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ["schedules", "available", siteFilter, dayPatternFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (siteFilter) params.append("site_id", siteFilter);
      if (dayPatternFilter) {
        // Convert day pattern to mask
        const mask = dayPatternFilter === "mws" ? 37 : dayPatternFilter === "tths" ? 42 : undefined;
        if (mask) params.append("day_of_week_mask", mask.toString());
      }
      const response = await httpClient.get(`/v1/schedules/available?${params.toString()}`);
      return response.data;
    },
    enabled: !!selectedChild,
  });

  // Create schedule change request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      student_id: string;
      current_schedule_id: string;
      requested_schedule_id: string;
      reason: string;
    }) => {
      const response = await httpClient.post("/v1/schedule-change-requests", data);
      return response.data;
    },
    onSuccess: () => {
      showToast({
        message: "Schedule change request submitted successfully!",
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: [parentHttpService.key] });
      navigate("/parents/my-requests");
    },
    onError: (error: any) => {
      showToast({
        message: error.response?.data?.message || "Failed to submit request",
        severity: "error",
      });
    },
  });

  const children = childrenData?.items ?? [];
  const schedules: AvailableSchedule[] = schedulesData?.items ?? [];

  // Get unique sites from schedules for filtering
  const sites = schedules.reduce((acc: { id: string; name: string }[], s) => {
    if (!acc.find((site) => site.id === s.site.id)) {
      acc.push(s.site);
    }
    return acc;
  }, []);

  // Get the selected child's current schedule (for excluding from available)
  const selectedChildData = children.find((c) => c.id === selectedChild);

  const handleChildChange = (event: SelectChangeEvent) => {
    const value = (event.target as unknown as { value: string }).value;
    setSelectedChild(value);
    setSelectedSchedule(null);
  };

  const handleSiteFilterChange = (event: SelectChangeEvent) => {
    setSiteFilter((event.target as unknown as { value: string }).value);
  };

  const handleDayPatternFilterChange = (event: SelectChangeEvent) => {
    setDayPatternFilter((event.target as unknown as { value: string }).value);
  };

  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReason((event.target as unknown as { value: string }).value);
  };

  const handleSubmitRequest = () => {
    if (!selectedChild || !selectedSchedule || !reason.trim()) return;

    const currentScheduleId = selectedChildData?.current_schedule_id;
    if (!currentScheduleId) {
      showToast({
        message:
          "We could not determine your child's current schedule. Please contact support.",
        severity: "error",
      });
      return;
    }

    createRequestMutation.mutate({
      student_id: selectedChild,
      current_schedule_id: currentScheduleId,
      requested_schedule_id: selectedSchedule.id,
      reason: reason.trim(),
    });
    setConfirmDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} color="inherit">
          Back
        </Button>
        <Typography variant="h4">Browse Available Schedules</Typography>
      </Stack>

      {/* Step 1: Select Child */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1: Select Child
          </Typography>
          {childrenLoading ? (
            <Skeleton variant="rounded" height={56} />
          ) : children.length === 0 ? (
            <Alert severity="info">No children are linked to your account.</Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select a child</InputLabel>
              <Select
                value={selectedChild}
                onChange={handleChildChange}
                label="Select a child"
              >
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.first_name} {child.last_name} - {child.site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* Step 2: Filter & Browse */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step 2: Browse Available Schedules
              </Typography>

              {/* Filters */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Location</InputLabel>
                  <Select
                    value={siteFilter}
                    onChange={handleSiteFilterChange}
                    label="Filter by Location"
                  >
                    <MenuItem value="">All Locations</MenuItem>
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Days</InputLabel>
                  <Select
                    value={dayPatternFilter}
                    onChange={handleDayPatternFilterChange}
                    label="Filter by Days"
                  >
                    <MenuItem value="">All Days</MenuItem>
                    <MenuItem value="mws">Mon/Wed/Sat</MenuItem>
                    <MenuItem value="tths">Tue/Thu/Sat</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Schedule Grid */}
              {schedulesLoading ? (
                <LoadingSkeleton />
              ) : schedules.length === 0 ? (
                <Alert severity="info">No available schedules match your filters.</Alert>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {schedules.map((schedule) => (
                    <Box
                      key={schedule.id}
                      sx={{
                        flex: "1 1 280px",
                        maxWidth: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.33% - 10px)" },
                      }}
                    >
                      <ScheduleCard
                        schedule={schedule}
                        selected={selectedSchedule?.id === schedule.id}
                        onSelect={setSelectedSchedule}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Submit Request */}
          {selectedSchedule && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Step 3: Provide Reason & Submit
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for schedule change"
                  placeholder="Please explain why you're requesting this schedule change (e.g., new work schedule, transportation issues, etc.)"
                  value={reason}
                  onChange={handleReasonChange}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={!reason.trim()}
                  size="large"
                >
                  Submit Schedule Change Request
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Schedule Change Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              You are requesting to change <strong>{selectedChildData?.first_name}</strong>'s
              schedule to:
            </Typography>
            {selectedSchedule && (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedSchedule.teacher.name}
                    </Typography>
                    <Typography variant="body2">{selectedSchedule.site.name}</Typography>
                    <Typography variant="body2">
                      {getDayPattern(selectedSchedule.day_of_week_mask)} at{" "}
                      {formatTime(selectedSchedule.start_time)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>Reason:</strong> {reason}
            </Typography>
            <Alert severity="info">
              Your request will be reviewed by an administrator. You'll be notified once it's
              approved or denied.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={createRequestMutation.isPending}
          >
            {createRequestMutation.isPending ? "Submitting..." : "Confirm Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
