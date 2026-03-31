import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useTeacherHttpService } from "../../teachers/services/TeacherHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useServerTable } from "../../global/hooks/useServerTable";

type RequestStatus = "pending" | "approved" | "denied" | "completed";

interface MakeupRequest {
  id: string;
  student_id: string;
  original_session_date: string;
  original_schedule_id: string;
  reason: string;
  reason_text: string | null;
  preferred_dates: string | null;
  status: RequestStatus;
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  original_schedule?: {
    id: string;
    site_name: string;
    teacher_name: string;
  };
  makeup_session?: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    teacher_name: string;
    site_name: string;
  } | null;
}

interface TeacherOption {
  id: string;
  user: {
    name: string;
  };
}

interface ScheduleSessionPayload {
  makeup_request_id: string;
  student_id: string;
  teacher_id: string;
  site_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
}

const STATUS_COLORS: Record<RequestStatus, "warning" | "success" | "error" | "info"> = {
  pending: "warning",
  approved: "success",
  denied: "error",
  completed: "info",
};

const REASON_LABELS: Record<string, string> = {
  sick: "Child was sick",
  family_emergency: "Family emergency",
  transportation: "Transportation issues",
  schedule_conflict: "Schedule conflict",
  no_show_unknown: "Unable to attend",
  other: "Other",
};

export default function MakeupRequestsPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const teacherHttpService = useTeacherHttpService();
  const locationHttpService = useLocationHttpService();
  const table = useServerTable({ defaultLimit: 20 });

  const statusFilter = (table.getFilter("status") || "") as RequestStatus | "";
  const [selectedRequest, setSelectedRequest] = useState<MakeupRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approved" | "denied">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    teacher_id: "",
    site_id: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  });

  // Fetch requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-makeup-requests", table.queryParams],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/makeup-requests`, {
        params: {
          page: table.page,
          limit: table.limit,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      return response.data as {
        items: MakeupRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "denied";
      notes?: string;
    }) => {
      const response = await httpClient.patch(`/v1/makeup-requests/${id}`, {
        status,
        review_notes: notes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-requests"] });
      handleCloseReviewDialog();
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: [teacherHttpService.key, "index", "makeup-requests-page"],
    queryFn: () => teacherHttpService.queries.index({ limit: 200, is_active: true, sort: "name" }),
  });

  const { data: locationsData = [] } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: locationHttpService.queries.index,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (payload: ScheduleSessionPayload) => {
      const response = await httpClient.post("/v1/makeup-sessions", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-requests"] });
      handleCloseScheduleDialog();
    },
  });

  const handleOpenReviewDialog = (request: MakeupRequest, action: "approved" | "denied") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setSelectedRequest(null);
    setReviewDialogOpen(false);
    setReviewNotes("");
  };

  const handleOpenScheduleDialog = (request: MakeupRequest) => {
    const defaultDate = request.original_session_date;
    const defaultSite = locationsData.find((l) => l.name === request.original_schedule?.site_name)?.id || "";

    setSelectedRequest(request);
    setScheduleForm({
      teacher_id: "",
      site_id: defaultSite,
      scheduled_date: defaultDate,
      scheduled_time: "10:00",
      notes: "",
    });
    setScheduleDialogOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedRequest(null);
    setScheduleForm({
      teacher_id: "",
      site_id: "",
      scheduled_date: "",
      scheduled_time: "",
      notes: "",
    });
  };

  const handleSubmitSchedule = () => {
    if (!selectedRequest) return;

    createSessionMutation.mutate({
      makeup_request_id: selectedRequest.id,
      student_id: selectedRequest.student_id,
      teacher_id: scheduleForm.teacher_id,
      site_id: scheduleForm.site_id,
      scheduled_date: scheduleForm.scheduled_date,
      scheduled_time: scheduleForm.scheduled_time,
      notes: scheduleForm.notes || undefined,
    });
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction,
      notes: reviewNotes,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const requests = data?.items ?? [];
  const teachers: TeacherOption[] = teachersData?.items ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Make-Up Requests</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => table.setFilter("status", e.target.value as RequestStatus | "")}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="denied">Denied</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load requests. Please try again.
        </Alert>
      )}

      {!isLoading && requests.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {statusFilter ? `No ${statusFilter} requests found.` : "No make-up requests found."}
          </Typography>
        </Paper>
      )}

      {requests.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Missed Session</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Site / Teacher</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.8rem" }}
                      >
                        {request.student?.initials || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {request.student?.first_name} {request.student?.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.student?.initials}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDate(request.original_session_date)}</TableCell>
                  <TableCell>
                    <Tooltip title={request.reason_text || ""} arrow>
                      <Typography variant="body2">
                        {REASON_LABELS[request.reason] || request.reason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.original_schedule?.site_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.original_schedule?.teacher_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDateTime(request.requested_at)}</Typography>
                    {request.preferred_dates && (
                      <Tooltip title={`Preferred: ${request.preferred_dates}`}>
                        <Typography variant="caption" color="text.secondary">
                          Has preferences
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      color={STATUS_COLORS[request.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {request.status === "pending" && (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleOpenReviewDialog(request, "approved")}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deny">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenReviewDialog(request, "denied")}
                          >
                            <DenyIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                    {request.status === "approved" && !request.makeup_session && (
                      <Tooltip title="Schedule make-up session">
                        <IconButton size="small" color="primary" onClick={() => handleOpenScheduleDialog(request)}>
                          <EventIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {request.status !== "pending" && request.review_notes && (
                      <Tooltip title={request.review_notes}>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={data?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />
        </TableContainer>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === "approved" ? "Approve Make-Up Request" : "Deny Make-Up Request"}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedRequest.student?.first_name} {selectedRequest.student?.last_name} (
                {selectedRequest.student?.initials})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missed: {formatDate(selectedRequest.original_session_date)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reason: {REASON_LABELS[selectedRequest.reason] || selectedRequest.reason}
              </Typography>
              {selectedRequest.reason_text && (
                <Typography variant="body2" color="text.secondary">
                  Details: {selectedRequest.reason_text}
                </Typography>
              )}
              {selectedRequest.preferred_dates && (
                <Typography variant="body2" color="text.secondary">
                  Preferred dates: {selectedRequest.preferred_dates}
                </Typography>
              )}
            </Box>
          )}
          <TextField
            label={reviewAction === "approved" ? "Notes (optional)" : "Reason for denial"}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required={reviewAction === "denied"}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={reviewMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewAction === "approved" ? "success" : "error"}
            onClick={handleSubmitReview}
            disabled={
              reviewMutation.isPending || (reviewAction === "denied" && !reviewNotes.trim())
            }
          >
            {reviewMutation.isPending ? (
              <CircularProgress size={20} />
            ) : reviewAction === "approved" ? (
              "Approve"
            ) : (
              "Deny"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={handleCloseScheduleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Make-Up Session</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={scheduleForm.teacher_id}
                label="Teacher"
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    teacher_id: (event.target as unknown as { value: string }).value,
                  }))
                }
              >
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={scheduleForm.site_id}
                label="Location"
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    site_id: (event.target as unknown as { value: string }).value,
                  }))
                }
              >
                {locationsData.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Date"
              value={scheduleForm.scheduled_date}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  scheduled_date: (event.target as unknown as { value: string }).value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              type="time"
              label="Time"
              value={scheduleForm.scheduled_time}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  scheduled_time: (event.target as unknown as { value: string }).value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={scheduleForm.notes}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  notes: (event.target as unknown as { value: string }).value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog} disabled={createSessionMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitSchedule}
            disabled={
              createSessionMutation.isPending ||
              !scheduleForm.teacher_id ||
              !scheduleForm.site_id ||
              !scheduleForm.scheduled_date ||
              !scheduleForm.scheduled_time
            }
          >
            {createSessionMutation.isPending ? <CircularProgress size={20} /> : "Schedule Session"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
