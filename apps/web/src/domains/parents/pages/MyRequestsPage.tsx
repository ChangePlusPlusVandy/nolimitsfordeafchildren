import { useQuery } from "@tanstack/react-query"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  Stack,
  Chip,
} from "@mui/material"
import {
  EventRepeat as MakeupIcon,
  SwapHoriz as ScheduleChangeIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material"
import { useState } from "react"
import { useHttpClient } from "../../../plugins/axios"

interface MakeupRequest {
  id: string
  student: {
    id: string
    first_name: string
    last_name: string
    initials: string
  }
  original_session_date: string
  reason: string
  reason_text: string | null
  preferred_dates: string | null
  status: "pending" | "approved" | "denied" | "completed"
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
  makeup_session?: {
    id: string
    scheduled_date: string
    scheduled_time: string
    teacher_name: string
    site_name: string
  } | null
}

interface ScheduleChangeRequest {
  id: string
  student: {
    id: string
    first_name: string
    last_name: string
    initials: string
  }
  current_schedule: {
    id: string
    teacher_name: string
    site_name: string
    days: string
    time: string
  }
  requested_schedule: {
    id: string
    teacher_name: string
    site_name: string
    days: string
    time: string
  }
  reason: string
  status: "pending" | "approved" | "denied"
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":")
  const hour = parseInt(hours!, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function getStatusColor(status: string): "warning" | "success" | "error" | "info" {
  switch (status) {
    case "pending":
      return "warning"
    case "approved":
    case "completed":
      return "success"
    case "denied":
      return "error"
    default:
      return "info"
  }
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatReason(reason: string): string {
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function MakeupRequestCard({ request }: { request: MakeupRequest }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <MakeupIcon color="action" />
              <Typography variant="h6">
                {request.student.first_name} {request.student.last_name}
              </Typography>
            </Stack>
            <Chip
              label={getStatusLabel(request.status)}
              color={getStatusColor(request.status)}
              size="small"
            />
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Original Session Date
            </Typography>
            <Typography variant="body1">
              {formatDate(request.original_session_date)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1">
              {formatReason(request.reason)}
              {request.reason_text && ` - ${request.reason_text}`}
            </Typography>
          </Box>

          {request.preferred_dates && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Preferred Dates
              </Typography>
              <Typography variant="body1">{request.preferred_dates}</Typography>
            </Box>
          )}

          {request.review_notes && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Admin Notes
              </Typography>
              <Typography variant="body1" fontStyle="italic">
                {request.review_notes}
              </Typography>
            </Box>
          )}

          {request.makeup_session && (
            <Alert severity="success" icon={<ScheduleIcon />}>
              <Typography variant="body2">
                Make-up scheduled for {formatDate(request.makeup_session.scheduled_date)} at{" "}
                {formatTime(request.makeup_session.scheduled_time)} with{" "}
                {request.makeup_session.teacher_name} at{" "}
                {request.makeup_session.site_name}
              </Typography>
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            Requested on {formatDate(request.created_at)}
            {request.reviewed_at &&
              ` • Reviewed on ${formatDate(request.reviewed_at)}`}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

function ScheduleChangeRequestCard({ request }: { request: ScheduleChangeRequest }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleChangeIcon color="action" />
              <Typography variant="h6">
                {request.student.first_name} {request.student.last_name}
              </Typography>
            </Stack>
            <Chip
              label={getStatusLabel(request.status)}
              color={getStatusColor(request.status)}
              size="small"
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Schedule
              </Typography>
              <Card variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {request.current_schedule.teacher_name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {request.current_schedule.days} at {request.current_schedule.time}
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 1,
              }}
            >
              <ScheduleChangeIcon color="action" />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Requested Schedule
              </Typography>
              <Card
                variant="outlined"
                sx={{ p: 1.5, bgcolor: "primary.50", borderColor: "primary.light" }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {request.requested_schedule.teacher_name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {request.requested_schedule.days} at {request.requested_schedule.time}
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            </Box>
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1">{request.reason}</Typography>
          </Box>

          {request.review_notes && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Admin Notes
              </Typography>
              <Typography variant="body1" fontStyle="italic">
                {request.review_notes}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Requested on {formatDate(request.created_at)}
            {request.reviewed_at &&
              ` • Reviewed on ${formatDate(request.reviewed_at)}`}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <Stack spacing={2}>
      {[1, 2, 3].map((i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rounded" width={80} height={24} />
              </Stack>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="80%" />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

export default function MyRequestsPage() {
  const httpClient = useHttpClient()
  const [tabValue, setTabValue] = useState(0)

  // Fetch makeup requests
  const {
    data: makeupData,
    isLoading: makeupLoading,
    error: makeupError,
  } = useQuery({
    queryKey: ["parents", "me", "makeup-requests"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/parents/me/makeup-requests")
      return response.data
    },
  })

  // Fetch schedule change requests
  const {
    data: scheduleChangeData,
    isLoading: scheduleChangeLoading,
    error: scheduleChangeError,
  } = useQuery({
    queryKey: ["parents", "me", "schedule-change-requests"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/parents/me/schedule-change-requests")
      return response.data
    },
  })

  const makeupRequests: MakeupRequest[] = makeupData?.items ?? []
  const scheduleChangeRequests: ScheduleChangeRequest[] = scheduleChangeData?.items ?? []

  const pendingMakeupCount = makeupRequests.filter(
    (r) => r.status === "pending"
  ).length
  const pendingScheduleChangeCount = scheduleChangeRequests.filter(
    (r) => r.status === "pending"
  ).length

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Requests
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          icon={<MakeupIcon />}
          iconPosition="start"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Make-Up Requests</span>
              {pendingMakeupCount > 0 && (
                <Chip label={pendingMakeupCount} size="small" color="warning" />
              )}
            </Stack>
          }
        />
        <Tab
          icon={<ScheduleChangeIcon />}
          iconPosition="start"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Schedule Changes</span>
              {pendingScheduleChangeCount > 0 && (
                <Chip
                  label={pendingScheduleChangeCount}
                  size="small"
                  color="warning"
                />
              )}
            </Stack>
          }
        />
      </Tabs>

      {tabValue === 0 && (
        <>
          {makeupLoading ? (
            <LoadingSkeleton />
          ) : makeupError ? (
            <Alert severity="error">Failed to load make-up requests</Alert>
          ) : makeupRequests.length === 0 ? (
            <Alert severity="info" icon={<MakeupIcon />}>
              You haven't submitted any make-up requests yet. You can request a
              make-up session from your child's details page when they miss a
              session.
            </Alert>
          ) : (
            <>
              {makeupRequests.map((request) => (
                <MakeupRequestCard key={request.id} request={request} />
              ))}
            </>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {scheduleChangeLoading ? (
            <LoadingSkeleton />
          ) : scheduleChangeError ? (
            <Alert severity="error">Failed to load schedule change requests</Alert>
          ) : scheduleChangeRequests.length === 0 ? (
            <Alert severity="info" icon={<ScheduleChangeIcon />}>
              You haven't submitted any schedule change requests yet. You can
              browse available schedules and request a change from the Schedule
              Change page.
            </Alert>
          ) : (
            <>
              {scheduleChangeRequests.map((request) => (
                <ScheduleChangeRequestCard key={request.id} request={request} />
              ))}
            </>
          )}
        </>
      )}
    </Box>
  )
}
