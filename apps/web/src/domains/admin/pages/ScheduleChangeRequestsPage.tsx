import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
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
  TablePagination,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  HourglassTop as NegotiateIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  SwapHoriz as SwapIcon,
} from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useServerTable } from "../../global/hooks/useServerTable";
import { useToast } from "../../global/components/ToastProvider";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import TableSkeleton from "../../global/components/skeletons/TableSkeleton";
import { formatDateTime, formatTime } from "../../../utils/formatDate";

type RequestStatus = "pending" | "negotiating" | "approved" | "denied" | "completed";

interface ScheduleInfo {
  id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  site: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
}

interface ScheduleChangeRequest {
  id: string;
  student_id: string;
  current_schedule_id: string;
  requested_schedule_id: string | null;
  preferred_times: string | null;
  flexibility_notes: string | null;
  teacher_response_status: "available" | "unavailable" | "conditional" | null;
  teacher_response_notes: string | null;
  teacher_responded_at: string | null;
  reason: string;
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
  current_schedule?: ScheduleInfo;
  requested_schedule?: ScheduleInfo;
}

const STATUS_COLORS: Record<RequestStatus, "warning" | "success" | "error" | "info"> = {
  pending: "warning",
  negotiating: "info",
  approved: "success",
  denied: "error",
  completed: "info",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysFromMask(mask: number): string {
  const days: string[] = [];
  DAY_NAMES.forEach((day, idx) => {
    if (mask & (1 << idx)) {
      days.push(day);
    }
  });
  return days.join("/");
}

function ScheduleDisplay({ schedule }: { schedule?: ScheduleInfo }) {
  if (!schedule) return <Typography color="text.secondary">Unknown</Typography>;

  return (
    <Box>
      <Typography variant="body2">{schedule.site.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        {getDaysFromMask(schedule.day_of_week_mask)} at {formatTime(schedule.start_time)}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        with {schedule.teacher.name}
      </Typography>
    </Box>
  );
}

export default function ScheduleChangeRequestsPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  const table = useServerTable({ defaultLimit: 20 });

  const statusFilter = (table.getFilter("status") || "") as RequestStatus | "";
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approved" | "denied" | "negotiating">(
    "approved",
  );
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-schedule-change-requests", table.queryParams],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/schedule-change-requests`, {
        params: {
          page: table.page,
          limit: table.limit,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      return response.data as {
        items: ScheduleChangeRequest[];
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
      status: "approved" | "denied" | "negotiating";
      notes?: string;
    }) => {
      const response = await httpClient.patch(`/v1/schedule-change-requests/${id}`, {
        status,
        review_notes: notes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-change-requests"] });
      toast.success("Request updated successfully");
      handleCloseReviewDialog();
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const handleOpenReviewDialog = (
    request: ScheduleChangeRequest,
    action: "approved" | "denied" | "negotiating",
  ) => {
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

  const handleSubmitReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction,
      notes: reviewNotes,
    });
  };

  const requests = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Schedule Change Requests"
        actions={
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
              <MenuItem value="negotiating">Negotiating</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
            </TextField>
            <IconButton onClick={() => refetch()} aria-label="Refresh requests">
              <RefreshIcon />
            </IconButton>
          </Stack>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorAlert
          message="Failed to load requests. Please try again."
          onRetry={() => refetch()}
        />
      ) : requests.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<SwapIcon sx={{ fontSize: 48 }} />}
            title="No Requests Found"
            description={
              statusFilter
                ? `No ${statusFilter} requests found.`
                : "No schedule change requests found."
            }
          />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Current Schedule</TableCell>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>Requested Schedule</TableCell>
                  <TableCell>Reason</TableCell>
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
                    <TableCell>
                      <ScheduleDisplay schedule={request.current_schedule} />
                    </TableCell>
                    <TableCell>
                      <ArrowIcon color="action" />
                    </TableCell>
                    <TableCell>
                      {request.requested_schedule ? (
                        <ScheduleDisplay schedule={request.requested_schedule} />
                      ) : (
                        <Stack spacing={0.5}>
                          <Typography variant="body2">Flexible request</Typography>
                          {request.preferred_times && (
                            <Typography variant="caption" color="text.secondary">
                              Preferred: {request.preferred_times}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={request.reason} arrow>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.reason}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(request.requested_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        color={STATUS_COLORS[request.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {(request.status === "pending" || request.status === "negotiating") && (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Mark Negotiating">
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => handleOpenReviewDialog(request, "negotiating")}
                              aria-label="Mark as negotiating"
                            >
                              <NegotiateIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleOpenReviewDialog(request, "approved")}
                              disabled={!request.requested_schedule}
                              aria-label="Approve request"
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deny">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleOpenReviewDialog(request, "denied")}
                              aria-label="Deny request"
                            >
                              <DenyIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                      {request.status !== "pending" && request.review_notes && (
                        <Tooltip title={request.review_notes}>
                          <Button size="small" sx={{ textTransform: "none" }}>
                            View notes
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={data?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />
        </SectionCard>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === "approved"
            ? "Approve Schedule Change"
            : reviewAction === "negotiating"
              ? "Mark as Negotiating"
              : "Deny Schedule Change"}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {selectedRequest.student?.first_name} {selectedRequest.student?.last_name} (
                  {selectedRequest.student?.initials})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reason: {selectedRequest.reason}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <SectionCard title="Current Schedule" sx={{ flex: 1 }}>
                  <ScheduleDisplay schedule={selectedRequest.current_schedule} />
                </SectionCard>
                <ArrowIcon color="action" />
                <SectionCard title="Requested Schedule" sx={{ flex: 1 }}>
                  {selectedRequest.requested_schedule ? (
                    <ScheduleDisplay schedule={selectedRequest.requested_schedule} />
                  ) : (
                    <Box>
                      <Typography variant="body2">Flexible request (no specific schedule)</Typography>
                      {selectedRequest.preferred_times && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Preferred times: {selectedRequest.preferred_times}
                        </Typography>
                      )}
                      {selectedRequest.flexibility_notes && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Notes: {selectedRequest.flexibility_notes}
                        </Typography>
                      )}
                    </Box>
                  )}
                </SectionCard>
              </Stack>

              {selectedRequest.teacher_response_status && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Teacher response: <strong>{selectedRequest.teacher_response_status}</strong>
                  {selectedRequest.teacher_response_notes
                    ? ` - ${selectedRequest.teacher_response_notes}`
                    : ""}
                </Alert>
              )}

              {reviewAction === "approved" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {selectedRequest.requested_schedule
                    ? "Approving this request will automatically update the student's enrollment to the new schedule."
                    : "This is a flexible request without a selected schedule. Move to Negotiating first or deny if unavailable."}
                </Alert>
              )}
            </Box>
          )}
          <TextField
            label={
              reviewAction === "approved"
                ? "Approval notes (optional)"
                : reviewAction === "negotiating"
                  ? "Negotiation notes"
                  : "Reason for denial"
            }
            value={reviewNotes}
            onChange={(e) =>
              setReviewNotes((e.target as unknown as { value: string }).value)
            }
            multiline
            rows={3}
            fullWidth
            required={reviewAction !== "approved"}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseReviewDialog} disabled={reviewMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewAction === "approved" ? "success" : reviewAction === "denied" ? "error" : "info"}
            onClick={handleSubmitReview}
            disabled={
              reviewMutation.isPending ||
              (reviewAction !== "approved" && !reviewNotes.trim()) ||
              (reviewAction === "approved" && !selectedRequest?.requested_schedule)
            }
          >
            {reviewMutation.isPending ? (
              <CircularProgress size={20} />
            ) : reviewAction === "approved" ? (
              "Approve"
            ) : reviewAction === "negotiating" ? (
              "Mark Negotiating"
            ) : (
              "Deny"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
