import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import {
  useTeacherHttpService,
  SCHEDULE_PATTERNS,
  decodeDayMask,
  encodeDayMask,
  type CreateScheduleInput,
} from "../services/TeacherHttpService";
import {
  useLocationHttpService,
  type Location,
} from "../../locations/services/LocationHttpService";
import { useHttpClient } from "../../../plugins/axios";
import type { SelectChangeEvent } from "@mui/material/Select";

const STEPS = ["Schedule Pattern", "Set Times", "Cycle Dates", "Review"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherScheduleWizardPage() {
  const { id: teacherId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teacherHttpService = useTeacherHttpService();
  const locationHttpService = useLocationHttpService();
  const httpClient = useHttpClient();

  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [patternType, setPatternType] = useState<"preset" | "custom">("preset");
  const [selectedPattern, setSelectedPattern] = useState<"MWS" | "TThS">("MWS");
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [siteId, setSiteId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [cycleStartDate, setCycleStartDate] = useState("");
  const [cycleEndDate, setCycleEndDate] = useState("");

  // Fetch teacher info
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: [teacherHttpService.key, "show", teacherId],
    queryFn: () => teacherHttpService.queries.show(teacherId!),
    enabled: !!teacherId,
  });

  const { data: teacherLocations = [] } = useQuery({
    queryKey: [teacherHttpService.key, "locations", teacherId],
    queryFn: () => teacherHttpService.queries.getLocations(teacherId!),
    enabled: !!teacherId,
  });

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: () => locationHttpService.queries.index(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", "list"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/sessions", {
        params: { include_archived: false, page: 1, limit: 200 },
      });
      return response.data as {
        items: Array<{
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          is_archived: boolean;
        }>;
      };
    },
  });

  const { data: currentSessionData } = useQuery({
    queryKey: ["sessions", "current"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/sessions/current");
      return response.data as {
        item: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          is_archived: boolean;
        } | null;
      };
    },
  });

  const { mutate: createSchedule, isPending } = useMutation({
    mutationKey: [teacherHttpService.key, "createSchedule"],
    mutationFn: teacherHttpService.mutations.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherHttpService.key, "show", teacherId] });
      navigate(`/teachers/${teacherId}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create schedule");
    },
  });

  const locations = (locationsData || []) as Location[];
  const locationOptions =
    teacherLocations.length > 0
      ? locations.filter((location) => teacherLocations.some((assigned) => assigned.id === location.id))
      : locations;
  const sessions = sessionsData?.items ?? [];

  useEffect(() => {
    if (sessionId || sessions.length === 0) {
      return;
    }

    const currentSession = currentSessionData?.item;
    const fallbackSession = sessions.find((session) => session.is_active) || sessions[0];
    const targetSession = currentSession || fallbackSession;

    if (!targetSession) {
      return;
    }

    setSessionId(targetSession.id);
    if (!cycleStartDate) {
      setCycleStartDate(targetSession.start_date);
    }
    if (!cycleEndDate) {
      setCycleEndDate(targetSession.end_date);
    }
  }, [sessionId, sessions, currentSessionData, cycleStartDate, cycleEndDate]);

  // Calculate day mask based on selection
  const getDayMask = (): number => {
    if (patternType === "preset") {
      return SCHEDULE_PATTERNS[selectedPattern].mask;
    }
    return encodeDayMask(customDays);
  };

  // Calculate end date (10 weeks from start)
  const calculateEndDate = (start: string): string => {
    if (!start) return "";
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() + 69); // 10 weeks = 70 days - 1
    return startDate.toISOString().split("T")[0]!;
  };

  const handleStartDateChange = (value: string) => {
    setCycleStartDate(value);
    // Auto-calculate end date as 10 weeks
    setCycleEndDate(calculateEndDate(value));
  };

  const handleNext = () => {
    setError(null);

    // Validation for each step
    if (activeStep === 0) {
      if (patternType === "custom" && customDays.length === 0) {
        setError("Please select at least one day");
        return;
      }
      if (!siteId) {
        setError("Please select a site");
        return;
      }
    } else if (activeStep === 1) {
      if (!startTime || !endTime) {
        setError("Please set both start and end times");
        return;
      }
      if (startTime >= endTime) {
        setError("End time must be after start time");
        return;
      }
    } else if (activeStep === 2) {
      if (!cycleStartDate || !cycleEndDate) {
        setError("Please set cycle dates");
        return;
      }
      if (cycleStartDate >= cycleEndDate) {
        setError("End date must be after start date");
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const payload: CreateScheduleInput & { teacherId: string } = {
      teacherId: teacherId!,
      site_id: siteId,
      session_id: sessionId || undefined,
      day_of_week_mask: getDayMask(),
      start_time: startTime,
      end_time: endTime,
      cycle_start_date: cycleStartDate,
      cycle_end_date: cycleEndDate,
    };

    createSchedule(payload);
  };

  const handleSiteChange = (event: SelectChangeEvent<string>) => {
    setSiteId((event.target as { value: string }).value);
  };

  const handlePatternTypeChange = (event: SelectChangeEvent<"preset" | "custom">) => {
    setPatternType((event.target as { value: "preset" | "custom" }).value);
  };

  const handleSessionChange = (event: SelectChangeEvent<string>) => {
    const nextSessionId = (event.target as { value: string }).value;
    setSessionId(nextSessionId);

    const session = sessions.find((item) => item.id === nextSessionId);
    if (session) {
      setCycleStartDate(session.start_date);
      setCycleEndDate(session.end_date);
    }
  };

  const handleStartTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStartTime((event.target as unknown as { value: string }).value);
  };

  const handleEndTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEndTime((event.target as unknown as { value: string }).value);
  };

  const handleCycleStartDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleStartDateChange((event.target as unknown as { value: string }).value);
  };

  const handleCycleEndDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCycleEndDate((event.target as unknown as { value: string }).value);
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours!, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (teacherLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedSite = locations.find((l) => l.id === siteId);
  const dayMask = getDayMask();
  const selectedDays = decodeDayMask(dayMask);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Box>
          <Typography variant="h4" component="h1">
            Create Schedule
          </Typography>
          {teacher && (
            <Typography variant="body2" color="text.secondary">
              for {teacher.user.name}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        {/* Step 1: Schedule Pattern */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Select Schedule Pattern</Typography>

            {/* Site Selection */}
            <FormControl fullWidth>
              <InputLabel>Site *</InputLabel>
              <Select
                value={siteId}
                label="Site *"
                onChange={handleSiteChange}
                disabled={locationsLoading}
              >
                {locationOptions.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Session (Optional)</InputLabel>
              <Select
                value={sessionId}
                label="Session (Optional)"
                onChange={handleSessionChange}
              >
                <MenuItem value="">
                  <em>No session</em>
                </MenuItem>
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name} ({session.start_date} to {session.end_date})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Pattern Type Selection */}
            <FormControl fullWidth>
              <InputLabel>Pattern Type</InputLabel>
              <Select
                value={patternType}
                label="Pattern Type"
                onChange={handlePatternTypeChange}
              >
                <MenuItem value="preset">Preset Pattern</MenuItem>
                <MenuItem value="custom">Custom Days</MenuItem>
              </Select>
            </FormControl>

            {/* Preset Pattern */}
            {patternType === "preset" && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Standard 10-week cycle patterns
                </Typography>
                <ToggleButtonGroup
                  value={selectedPattern}
                  exclusive
                  onChange={(_, value) => value && setSelectedPattern(value)}
                  fullWidth
                >
                  <ToggleButton value="MWS">{SCHEDULE_PATTERNS.MWS.label}</ToggleButton>
                  <ToggleButton value="TThS">{SCHEDULE_PATTERNS.TThS.label}</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Custom Days */}
            {patternType === "custom" && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Select specific days
                </Typography>
                <ToggleButtonGroup
                  value={customDays}
                  onChange={(_, value) => setCustomDays(value)}
                  fullWidth
                >
                  {DAYS.map((day) => (
                    <ToggleButton key={day} value={day} size="small">
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Preview */}
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Days:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  {selectedDays.map((day) => (
                    <Chip key={day} label={day} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
          </Box>
        )}

        {/* Step 2: Set Times */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Set Session Times</Typography>

            <TextField
              label="Start Time *"
              type="time"
              value={startTime}
              onChange={handleStartTimeChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="End Time *"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Session Duration:
              </Typography>
              <Typography variant="body1">
                {startTime && endTime ? (
                  <>
                    {formatTime(startTime)} - {formatTime(endTime)}
                    {startTime < endTime && (
                      <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                        (
                        {Math.round(
                          (new Date(`2000-01-01T${endTime}`).getTime() -
                            new Date(`2000-01-01T${startTime}`).getTime()) /
                            60000,
                        )}{" "}
                        minutes)
                      </Typography>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Step 3: Cycle Dates */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Set 10-Week Cycle Dates</Typography>

            <TextField
              label="Cycle Start Date *"
              type="date"
              value={cycleStartDate}
              onChange={handleCycleStartDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Cycle End Date *"
              type="date"
              value={cycleEndDate}
              onChange={handleCycleEndDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Auto-calculated as 10 weeks from start date"
            />

            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Cycle Duration:
              </Typography>
              <Typography variant="body1">
                {cycleStartDate && cycleEndDate ? (
                  <>
                    {cycleStartDate} to {cycleEndDate}
                    <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                      (
                      {Math.round(
                        (new Date(cycleEndDate).getTime() - new Date(cycleStartDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      days)
                    </Typography>
                  </>
                ) : (
                  "—"
                )}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Step 4: Review */}
        {activeStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Review Schedule</Typography>

            <List>
              <ListItem>
                <ListItemText primary="Teacher" secondary={teacher?.user.name || "—"} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Site" secondary={selectedSite?.name || "—"} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Session"
                  secondary={sessions.find((session) => session.id === sessionId)?.name || "No session"}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Days"
                  secondary={
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                      {selectedDays.map((day) => (
                        <Chip key={day} label={day} size="small" />
                      ))}
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Time"
                  secondary={`${formatTime(startTime)} - ${formatTime(endTime)}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Cycle" secondary={`${cycleStartDate} to ${cycleEndDate}`} />
              </ListItem>
            </List>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button disabled={activeStep === 0 || isPending} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={isPending ? <CircularProgress size={20} /> : <CheckIcon />}
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? "Creating..." : "Create Schedule"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
