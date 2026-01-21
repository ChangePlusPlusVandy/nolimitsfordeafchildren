import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
} from "@mui/material"
import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material"
import { useHttpClient } from "../../../plugins/axios"

type RequestStatus = "pending" | "approved" | "denied" | "completed"

interface ScheduleInfo {
  id: string
  day_of_week_mask: number
  start_time: string
  end_time: string
  cycle_start_date: string
  cycle_end_date: string
  site: {
    id: string
    name: string
  }
  teacher: {
    id: string
    name: string
  }
}

interface ScheduleChangeRequest {
  id: string
  student_id: string
  current_schedule_id: string
  requested_schedule_id: string
  reason: string
  status: RequestStatus
  requested_by: string
  requested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  student?: {
    id: string
    initials: string
    first_name: string
    last_name: string
  }
  current_schedule?: ScheduleInfo
  requested_schedule?: ScheduleInfo
}

const STATUS_COLORS: Record<RequestStatus, "warning" | "success" | "error" | "info"> = {
  pending: "warning",
  approved: "success",
  denied: "error",
  completed: "info",
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysFromMask(mask: number): string {
  const days: string[] = []
  DAY_NAMES.forEach((day, idx) => {
    if (mask & (1 << idx)) {
      days.push(day)
    }
  })
  return days.join("/")
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":")
  const hour = parseInt(hours!, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function ScheduleDisplay({ schedule }: { schedule?: ScheduleInfo }) {
  if (!schedule) return <Typography color="text.secondary">Unknown</Typography>
  
  return (
    <Box>
      <Typography variant="body2">
        {schedule.site.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {getDaysFromMask(schedule.day_of_week_mask)} at {formatTime(schedule.start_time)}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        with {schedule.teacher.name}
      </Typography>
    </Box>
  )
}

export default function ScheduleChangeRequestsPage() {
  const httpClient = useHttpClient()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("")
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approved" | "denied">("approved")
  const [reviewNotes, setReviewNotes] = useState("")

  // Fetch requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-schedule-change-requests", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      const response = await httpClient.get(`/v1/schedule-change-requests?${params}`)
      return response.data as { items: ScheduleChangeRequest[] }
    },
  })

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "denied"; notes?: string }) => {
      const response = await httpClient.patch(`/v1/schedule-change-requests/${id}`, {
        status,
        review_notes: notes || undefined,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-change-requests"] })
      handleCloseReviewDialog()
    },
  })

  const handleOpenReviewDialog = (request: ScheduleChangeRequest, action: "approved" | "denied") => {
    setSelectedRequest(request)
    setReviewAction(action)
    setReviewNotes("")
    setReviewDialogOpen(true)
  }

  const handleCloseReviewDialog = () => {
    setSelectedRequest(null)
    setReviewDialogOpen(false)
    setReviewNotes("")
  }

  const handleSubmitReview = () => {
    if (!selectedRequest) return
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction,
      notes: reviewNotes,
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const requests = data?.items ?? []

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Schedule Change Requests</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="denied">Denied</MenuItem>
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
            {statusFilter ? `No ${statusFilter} requests found.` : "No schedule change requests found."}
          </Typography>
        </Paper>
      )}

      {requests.length > 0 && (
        <TableContainer component={Paper}>
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
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.8rem" }}>
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
                    <ScheduleDisplay schedule={request.requested_schedule} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={request.reason} arrow>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap" 
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
        </TableContainer>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === "approved" ? "Approve Schedule Change" : "Deny Schedule Change"}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {selectedRequest.student?.first_name} {selectedRequest.student?.last_name} ({selectedRequest.student?.initials})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reason: {selectedRequest.reason}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Paper sx={{ p: 2, flex: 1 }} variant="outlined">
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Current Schedule
                  </Typography>
                  <ScheduleDisplay schedule={selectedRequest.current_schedule} />
                </Paper>
                <ArrowIcon color="action" />
                <Paper sx={{ p: 2, flex: 1 }} variant="outlined">
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Requested Schedule
                  </Typography>
                  <ScheduleDisplay schedule={selectedRequest.requested_schedule} />
                </Paper>
              </Stack>

              {reviewAction === "approved" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Approving this request will automatically update the student's enrollment to the new schedule.
                </Alert>
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
            disabled={reviewMutation.isPending || (reviewAction === "denied" && !reviewNotes.trim())}
          >
            {reviewMutation.isPending ? (
              <CircularProgress size={20} />
            ) : reviewAction === "approved" ? (
              "Approve & Update Enrollment"
            ) : (
              "Deny"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
