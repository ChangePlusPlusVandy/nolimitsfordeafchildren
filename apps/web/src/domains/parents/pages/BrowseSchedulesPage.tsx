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
  TablePagination,
  Alert,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import type { ChangeEvent } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useParentHttpService } from "../services/ParentHttpService";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import EmptyState from "../../global/components/EmptyState";
import { formatTime } from "../../../utils/formatDate";

interface AvailableSchedule {
  id: string;
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
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
        border: 2,
        borderColor: selected ? "primary.main" : "transparent",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
          borderColor: selected ? "primary.main" : "primary.light",
        },
      }}
    >
      <CardActionArea onClick={() => onSelect(schedule)} sx={{ height: "100%" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                {schedule.teacher.user.name}
              </Typography>
            </Stack>

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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 2,
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent>
            <Stack spacing={1}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="70%" />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default function BrowseSchedulesPage() {
  const navigate = useNavigate();
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const parentHttpService = useParentHttpService();
  const toast = useToast();

  // State
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [dayPatternFilter, setDayPatternFilter] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<AvailableSchedule | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [reason, setReason] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [flexibilityNotes, setFlexibilityNotes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch linked children
  const { data: childrenData, isLoading: childrenLoading } = useQuery({
    queryKey: [parentHttpService.key, "myChildren"],
    queryFn: () => parentHttpService.queries.myChildren({ page: 1, limit: 100 }),
  });

  // Get the selected child's current schedule (for excluding from available)
  const children = childrenData?.items ?? [];
  const selectedChildData = children.find((c) => c.id === selectedChild);

  // Fetch available schedules
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ["schedules", "available", siteFilter, dayPatternFilter, selectedChild, page, rowsPerPage],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/schedules/available`, {
        params: {
          page,
          limit: rowsPerPage,
          ...(siteFilter ? { site_id: siteFilter } : {}),
          ...(dayPatternFilter ? { day_pattern: dayPatternFilter } : {}),
          ...(selectedChildData?.current_schedule_id
            ? { exclude_current_schedule_id: selectedChildData.current_schedule_id }
            : {}),
        },
      });
      return response.data;
    },
    enabled: !!selectedChild,
  });

  // Create schedule change request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      student_id: string;
      current_schedule_id: string;
      requested_schedule_id?: string;
      preferred_times?: string;
      flexibility_notes?: string;
      reason: string;
    }) => {
      const response = await httpClient.post("/v1/schedule-change-requests", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Schedule change request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: [parentHttpService.key] });
      navigate("/parents/my-requests");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit request");
    },
  });

  const schedules: AvailableSchedule[] = schedulesData?.items ?? [];

  // Get unique sites from schedules for filtering
  const sites = schedules.reduce((acc: { id: string; name: string }[], s) => {
    if (!acc.find((site) => site.id === s.site.id)) {
      acc.push(s.site);
    }
    return acc;
  }, []);

  const handleChildChange = (event: SelectChangeEvent) => {
    const value = (event.target as unknown as { value: string }).value;
    setSelectedChild(value);
    setSelectedSchedule(null);
    setPage(1);
    setPreferredTimes("");
    setFlexibilityNotes("");
  };

  const handleSiteFilterChange = (event: SelectChangeEvent) => {
    setSiteFilter((event.target as unknown as { value: string }).value);
    setPage(1);
  };

  const handleDayPatternFilterChange = (event: SelectChangeEvent) => {
    setDayPatternFilter((event.target as unknown as { value: string }).value);
    setPage(1);
  };

  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReason((event.target as unknown as { value: string }).value);
  };

  const handleSubmitRequest = () => {
    if (!selectedChild || !reason.trim()) return;

    const currentScheduleId = selectedChildData?.current_schedule_id;
    if (!currentScheduleId) {
      toast.error("We could not determine your child's current schedule. Please contact support.");
      return;
    }

    const hasSpecificSchedule = Boolean(selectedSchedule);
    if (!hasSpecificSchedule && !preferredTimes.trim()) {
      toast.error("Please add preferred times when requesting a flexible schedule change.");
      return;
    }

    createRequestMutation.mutate({
      student_id: selectedChild,
      current_schedule_id: currentScheduleId,
      requested_schedule_id: selectedSchedule?.id,
      preferred_times: preferredTimes.trim() || undefined,
      flexibility_notes: flexibilityNotes.trim() || undefined,
      reason: reason.trim(),
    });
    setConfirmDialogOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Browse Available Schedules"
        back
        breadcrumbs={[
          { label: "My Requests", href: "/parents/my-requests" },
          { label: "Browse Schedules" },
        ]}
      />

      <Stack spacing={3}>
      {/* Step 1: Select Child */}
      <SectionCard title="Step 1: Select Child">
        {childrenLoading ? (
          <Skeleton variant="rounded" height={56} />
        ) : children.length === 0 ? (
          <EmptyState
            title="No Children Linked"
            description="No children are linked to your account."
          />
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
      </SectionCard>

      {selectedChild && (
        <>
          {/* Step 2: Filter & Browse */}
          <SectionCard title="Step 2: Browse Available Schedules">
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
              <EmptyState
                icon={<ScheduleIcon sx={{ fontSize: 48 }} />}
                title="No Available Schedules"
                description="No available schedules match your filters. Try adjusting or removing filters."
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {schedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      selected={selectedSchedule?.id === schedule.id}
                      onSelect={setSelectedSchedule}
                    />
                  ))}
                </Box>
                <TablePagination
                  rowsPerPageOptions={[6, 9, 18]}
                  component="div"
                  count={schedulesData?.total ?? 0}
                  rowsPerPage={rowsPerPage}
                  page={Math.max(page - 1, 0)}
                  onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                />
              </>
            )}

            {selectedSchedule && (
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button size="small" onClick={() => setSelectedSchedule(null)}>
                  Use flexible request instead
                </Button>
              </Stack>
            )}
          </SectionCard>

          {/* Flexible Request (when no schedule selected) */}
          {!selectedSchedule && (
            <SectionCard title="Flexible Request (Optional Instead of Selecting a Schedule)">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                If none of the listed schedules work, share your preferred times and any flexibility
                details so admins can coordinate with teachers.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Preferred times"
                  placeholder="Example: Weekdays after 4:30 PM, Saturday mornings"
                  value={preferredTimes}
                  onChange={(event) =>
                    setPreferredTimes((event.target as unknown as { value: string }).value)
                  }
                  required
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Flexibility notes (optional)"
                  placeholder="Example: Can do either M/W/S or T/Th/S, but cannot start before 4 PM"
                  value={flexibilityNotes}
                  onChange={(event) =>
                    setFlexibilityNotes((event.target as unknown as { value: string }).value)
                  }
                />
              </Stack>
            </SectionCard>
          )}

          {/* Step 3: Submit */}
          <SectionCard title="Step 3: Provide Reason & Submit">
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
              disabled={!reason.trim() || (!selectedSchedule && !preferredTimes.trim())}
              size="large"
            >
              Submit Schedule Change Request
            </Button>
          </SectionCard>
        </>
      )}
      </Stack>

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
            {selectedSchedule ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedSchedule.teacher.user.name}
                    </Typography>
                    <Typography variant="body2">{selectedSchedule.site.name}</Typography>
                    <Typography variant="body2">
                      {getDayPattern(selectedSchedule.day_of_week_mask)} at{" "}
                      {formatTime(selectedSchedule.start_time)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Flexible schedule request
                    </Typography>
                    <Typography variant="body2">
                      <strong>Preferred times:</strong> {preferredTimes || "Not provided"}
                    </Typography>
                    {flexibilityNotes && (
                      <Typography variant="body2">
                        <strong>Flexibility notes:</strong> {flexibilityNotes}
                      </Typography>
                    )}
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
    </PageContainer>
  );
}
