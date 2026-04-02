import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  HelpOutline as ConditionalIcon,
  SwapHoriz as ScheduleChangeIcon,
} from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";

type RequestStatus = "pending" | "negotiating" | "approved" | "denied" | "completed";
type TeacherResponseStatus = "available" | "unavailable" | "conditional";

interface ScheduleInfo {
  id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
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
  reason: string;
  status: RequestStatus;
  requested_at: string;
  preferred_times: string | null;
  flexibility_notes: string | null;
  teacher_response_status: TeacherResponseStatus | null;
  teacher_response_notes: string | null;
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  current_schedule?: ScheduleInfo;
  requested_schedule?: ScheduleInfo;
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getDaysFromMask(mask: number): string {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayLabels.filter((_, index) => (mask & (1 << index)) !== 0).join("/");
}

function ScheduleSummary({ schedule }: { schedule?: ScheduleInfo }) {
  if (!schedule) {
    return <Typography variant="body2">No specific requested schedule</Typography>;
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">{schedule.site.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        {getDaysFromMask(schedule.day_of_week_mask)} at {formatTime(schedule.start_time)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Teacher: {schedule.teacher.name}
      </Typography>
    </Stack>
  );
}

export default function TeacherScheduleChangeRequestsPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [dialogStatus, setDialogStatus] = useState<TeacherResponseStatus>("available");
  const [dialogNotes, setDialogNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-schedule-change-requests", page, rowsPerPage],
    queryFn: async () => {
      const response = await httpClient.get("/v1/schedule-change-requests", {
        params: {
          page,
          limit: rowsPerPage,
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

  const respondMutation = useMutation({
    mutationFn: async (payload: {
      requestId: string;
      response_status: TeacherResponseStatus;
      notes?: string;
    }) => {
      const response = await httpClient.patch(
        `/v1/schedule-change-requests/${payload.requestId}/teacher-response`,
        {
          response_status: payload.response_status,
          notes: payload.notes || undefined,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-schedule-change-requests"] });
      setSelectedRequest(null);
      setDialogNotes("");
      setDialogStatus("available");
    },
  });

  const items = data?.items ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <ScheduleChangeIcon color="action" />
        <Typography variant="h4">Schedule Change Requests</Typography>
      </Stack>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load schedule change requests.
        </Alert>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Alert severity="info">No schedule change requests currently need your response.</Alert>
      )}

      <Stack spacing={2}>
        {items.map((request) => (
          <Card key={request.id} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {request.student?.first_name} {request.student?.last_name}
                  </Typography>
                  <Chip
                    label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    size="small"
                    color={request.status === "approved" ? "success" : "default"}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Reason: {request.reason}
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Current Schedule
                    </Typography>
                    <ScheduleSummary schedule={request.current_schedule} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Requested Schedule
                    </Typography>
                    <ScheduleSummary schedule={request.requested_schedule} />
                  </Box>
                </Stack>

                {!request.requested_schedule && request.preferred_times && (
                  <Alert severity="info">
                    Preferred times: <strong>{request.preferred_times}</strong>
                    {request.flexibility_notes ? ` - ${request.flexibility_notes}` : ""}
                  </Alert>
                )}

                {request.teacher_response_status && (
                  <Alert severity="success">
                    You responded: {request.teacher_response_status}
                    {request.teacher_response_notes ? ` - ${request.teacher_response_notes}` : ""}
                  </Alert>
                )}

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    color="success"
                    startIcon={<AvailableIcon />}
                    onClick={() => {
                      setSelectedRequest(request);
                      setDialogStatus("available");
                      setDialogNotes("");
                    }}
                  >
                    Available
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<ConditionalIcon />}
                    onClick={() => {
                      setSelectedRequest(request);
                      setDialogStatus("conditional");
                      setDialogNotes("");
                    }}
                  >
                    Conditional
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<UnavailableIcon />}
                    onClick={() => {
                      setSelectedRequest(request);
                      setDialogStatus("unavailable");
                      setDialogNotes("");
                    }}
                  >
                    Unavailable
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {items.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={data?.total ?? 0}
          rowsPerPage={rowsPerPage}
          page={Math.max(page - 1, 0)}
          onPageChange={(_event, nextPage) => setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(1);
          }}
        />
      )}

      <Dialog open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Teacher Response</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              Set response to <strong>{dialogStatus}</strong>
              {selectedRequest ? ` for ${selectedRequest.student?.first_name} ${selectedRequest.student?.last_name}` : ""}.
            </Typography>
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              fullWidth
              value={dialogNotes}
              onChange={(event) =>
                setDialogNotes((event.target as unknown as { value: string }).value)
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRequest(null)} disabled={respondMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!selectedRequest) return;
              respondMutation.mutate({
                requestId: selectedRequest.id,
                response_status: dialogStatus,
                notes: dialogNotes.trim() || undefined,
              });
            }}
            disabled={respondMutation.isPending}
          >
            {respondMutation.isPending ? "Saving..." : "Submit Response"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
