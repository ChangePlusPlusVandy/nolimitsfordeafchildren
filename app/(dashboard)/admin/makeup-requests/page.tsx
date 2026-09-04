"use client";

import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  EventBusy as EventBusyIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import TableSkeleton from "@/client/components/skeletons/TableSkeleton";
import { useToast } from "@/client/components/ToastProvider";
import { useServerTable } from "@/client/hooks/useServerTable";
import { listAllLocations } from "@/client/locations";
import { createMakeupSession, listMakeupRequests, reviewMakeupRequest } from "@/client/makeups";
import { listTeachers } from "@/client/teachers";
import { formatDate, formatDateTime } from "@/client/utils/formatDate";

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

function MakeupRequestsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
    queryFn: () =>
      listMakeupRequests({
        page: table.page,
        limit: table.limit,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "denied";
      notes?: string;
    }) =>
      reviewMakeupRequest(id, {
        status,
        review_notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-requests"] });
      toast.success("Request updated successfully");
      handleCloseReviewDialog();
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers", "index", "makeup-requests-page"],
    queryFn: () => listTeachers({ limit: 200, is_active: true, sort: "name" as never }),
  });

  const { data: locationsData = [] } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
  });

  const createSessionMutation = useMutation({
    mutationFn: (payload: ScheduleSessionPayload) => createMakeupSession(payload as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-makeup-requests"] });
      toast.success("Make-up session scheduled successfully");
      handleCloseScheduleDialog();
    },
    onError: () => {
      toast.error("Failed to schedule make-up session");
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
    const defaultSite =
      locationsData.find((l) => l.name === request.original_schedule?.site_name)?.id || "";

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

  const requests = (data?.items ?? []) as unknown as MakeupRequest[];
  const teachers: TeacherOption[] = teachersData?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Make-Up Requests"
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
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
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
            icon={<EventBusyIcon sx={{ fontSize: 48 }} />}
            title="No Requests Found"
            description={
              statusFilter ? `No ${statusFilter} requests found.` : "No make-up requests found."
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
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                            fontSize: "0.8rem",
                          }}
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
                      <Typography variant="body2">
                        {request.original_schedule?.site_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.original_schedule?.teacher_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(request.requested_at)}
                      </Typography>
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
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleOpenReviewDialog(request, "approved")}
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
                      {request.status === "approved" && !request.makeup_session && (
                        <Tooltip title="Schedule make-up session">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenScheduleDialog(request)}
                            aria-label="Schedule make-up session"
                          >
                            <EventIcon />
                          </IconButton>
                        </Tooltip>
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
          {reviewAction === "approved" ? "Approve Make-Up Request" : "Deny Make-Up Request"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {selectedRequest && (
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
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
              onChange={(e) => setReviewNotes((e.target as unknown as { value: string }).value)}
              multiline
              rows={3}
              fullWidth
              required={reviewAction === "denied"}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
          <Stack spacing={2.5} sx={{ mt: 1 }}>
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
              slotProps={{ inputLabel: { shrink: true } }}
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
              slotProps={{ inputLabel: { shrink: true } }}
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
    </PageContainer>
  );
}

export default function MakeupRequestsPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MakeupRequestsPage />
    </Suspense>
  );
}
