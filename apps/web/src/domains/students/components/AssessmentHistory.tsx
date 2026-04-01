import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Slider,
  Collapse,
  Stack,
  TablePagination,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useHttpClient } from "../../../plugins/axios";

interface Assessment {
  id: string;
  student_id: string;
  teacher_id: string;
  cycle_start_date: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  summary: string | null;
  focuses?: AssessmentFocus[];
  score: number;
  notes: string | null;
  assessed_at: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
  };
}

interface AssessmentFocus {
  id?: string;
  goal: string;
  score: number;
  max_score: number;
  sort_order?: number;
}

interface AssessmentCycle {
  cycle_start_date: string;
  pre_assessment?: Assessment;
  post_assessment?: Assessment;
  improvement?: number;
}

interface AssessmentHistoryProps {
  studentId: string;
  canAdd?: boolean;
  canEdit?: boolean;
}

const TEACHING_FOCUS_OPTIONS = [
  "Articulation",
  "Vocabulary",
  "Listening Skills",
  "Speech Comprehension",
  "Language Development",
  "Auditory Memory",
  "Phonological Awareness",
  "Reading Skills",
  "Other",
];

export default function AssessmentHistory({
  studentId,
  canAdd = false,
  canEdit = false,
}: AssessmentHistoryProps) {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [cloningAssessmentId, setCloningAssessmentId] = useState<string | null>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [cycleStartDate, setCycleStartDate] = useState("");
  const [assessmentType, setAssessmentType] = useState<"pre" | "post">("pre");
  const [teachingFocus, setTeachingFocus] = useState("");
  const [score, setScore] = useState(10);
  const [notes, setNotes] = useState("");
  const [focuses, setFocuses] = useState<AssessmentFocus[]>([{ goal: "", score: 0, max_score: 10 }]);

  // Fetch assessments
  const { data, isLoading, error } = useQuery({
    queryKey: ["assessments", studentId, page, rowsPerPage],
    queryFn: async () => {
      const response = await httpClient.get(`/v1/students/${studentId}/assessments`, {
        params: {
          page,
          limit: rowsPerPage,
        },
      });
      return response.data as {
        items: AssessmentCycle[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });

  // Create assessment mutation
  const createMutation = useMutation({
    mutationFn: async (input: {
      cycle_start_date: string;
      assessment_type: "pre" | "post";
      teaching_focus: string;
      focuses?: AssessmentFocus[];
      summary?: string;
      score: number;
      notes?: string;
    }) => {
      const response = await httpClient.post(`/v1/students/${studentId}/assessments`, input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      handleCloseDialog();
    },
  });

  // Update assessment mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { teaching_focus?: string; summary?: string; focuses?: AssessmentFocus[]; score?: number; notes?: string };
    }) => {
      const response = await httpClient.patch(`/v1/assessments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      handleCloseDialog();
    },
  });

  // Delete assessment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(`/v1/assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload?: {
        cycle_start_date?: string;
        assessment_type?: "pre" | "post";
        teaching_focus?: string;
        focuses?: AssessmentFocus[];
        score?: number;
        notes?: string;
      };
    }) => {
      const response = await httpClient.post(`/v1/assessments/${id}/clone`, payload || {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = (assessment?: Assessment) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setCloningAssessmentId(null);
      setCycleStartDate(assessment.cycle_start_date);
      setAssessmentType(assessment.assessment_type);
      setTeachingFocus(assessment.teaching_focus);
      setScore(assessment.score);
      setNotes(assessment.notes || "");
      setFocuses(
        assessment.focuses && assessment.focuses.length > 0
          ? assessment.focuses
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((focus) => ({
                goal: focus.goal,
                score: focus.score,
                max_score: focus.max_score,
              }))
          : [{ goal: assessment.teaching_focus || "", score: assessment.score, max_score: 20 }],
      );
    } else {
      setEditingAssessment(null);
      setCloningAssessmentId(null);
      // Default to today's Monday as cycle start
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      setCycleStartDate(monday.toISOString().split("T")[0] ?? "");
      setAssessmentType("pre");
      setTeachingFocus("");
      setScore(10);
      setNotes("");
      setFocuses([{ goal: "", score: 0, max_score: 10 }]);
    }
    setDialogOpen(true);
  };

  const handleCloneDialog = (assessment: Assessment) => {
    setEditingAssessment(null);
    setCloningAssessmentId(assessment.id);
    setCycleStartDate(assessment.cycle_start_date);
    setAssessmentType(assessment.assessment_type === "pre" ? "post" : "pre");
    setTeachingFocus(assessment.teaching_focus);
    setScore(assessment.score);
    setNotes(assessment.notes || "");
    setFocuses(
      assessment.focuses && assessment.focuses.length > 0
        ? assessment.focuses
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((focus) => ({
              goal: focus.goal,
              score: focus.score,
              max_score: focus.max_score,
            }))
        : [{ goal: assessment.teaching_focus || "", score: assessment.score, max_score: 20 }],
    );
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssessment(null);
    setCloningAssessmentId(null);
    setCycleStartDate("");
    setAssessmentType("pre");
    setTeachingFocus("");
    setScore(10);
    setNotes("");
    setFocuses([{ goal: "", score: 0, max_score: 10 }]);
  };

  const sanitizedFocuses = focuses
    .map((focus) => ({
      goal: focus.goal.trim(),
      score: Number(focus.score),
      max_score: Number(focus.max_score),
    }))
    .filter((focus) => focus.goal.length > 0);

  const hasInvalidFocuses = sanitizedFocuses.some(
    (focus) => focus.max_score <= 0 || focus.score < 0 || focus.score > focus.max_score,
  );

  const legacyTeachingFocus =
    sanitizedFocuses.length > 0 ? sanitizedFocuses.map((focus) => focus.goal).join(" | ") : teachingFocus;
  const totalFocusScore = sanitizedFocuses.reduce((sum, focus) => sum + focus.score, 0);
  const totalFocusMaxScore = sanitizedFocuses.reduce((sum, focus) => sum + focus.max_score, 0);
  const legacyScore =
    sanitizedFocuses.length > 0 && totalFocusMaxScore > 0
      ? Math.round((totalFocusScore / totalFocusMaxScore) * 20)
      : score;

  const handleSave = () => {
    if (!cycleStartDate || hasInvalidFocuses || sanitizedFocuses.length === 0) return;

    if (editingAssessment) {
      updateMutation.mutate({
        id: editingAssessment.id,
        data: {
          teaching_focus: legacyTeachingFocus,
          focuses: sanitizedFocuses,
          score: legacyScore,
          notes: notes || undefined,
        },
      });
    } else if (cloningAssessmentId) {
      cloneMutation.mutate({
        id: cloningAssessmentId,
        payload: {
          cycle_start_date: cycleStartDate,
          assessment_type: assessmentType,
          teaching_focus: legacyTeachingFocus,
          focuses: sanitizedFocuses,
          score: legacyScore,
          notes: notes || undefined,
        },
      });
    } else {
      createMutation.mutate({
        cycle_start_date: cycleStartDate,
        assessment_type: assessmentType,
        teaching_focus: legacyTeachingFocus,
        focuses: sanitizedFocuses,
        score: legacyScore,
        notes: notes || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    const confirmed = (
      globalThis as unknown as { confirm?: (message?: string) => boolean }
    ).confirm?.("Are you sure you want to delete this assessment?");

    if (confirmed !== false) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const cycles = data?.items ?? [];

  const getScoreColor = (score: number) => {
    if (score >= 15) return "success";
    if (score >= 10) return "warning";
    return "error";
  };

  const getImprovementChip = (improvement: number | undefined) => {
    if (improvement === undefined) return null;
    if (improvement > 0) {
      return (
        <Chip icon={<TrendingUpIcon />} label={`+${improvement}`} color="success" size="small" />
      );
    }
    if (improvement < 0) {
      return (
        <Chip
          icon={<TrendingDownIcon />}
          label={improvement.toString()}
          color="error"
          size="small"
        />
      );
    }
    return <Chip label="No change" size="small" variant="outlined" />;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          <AssessmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Assessments
        </Typography>
        {canAdd && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Assessment
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load assessments. Please try again.
        </Alert>
      )}

      {!isLoading && cycles.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No assessments recorded yet.
        </Typography>
      )}

      {cycles.length > 0 && (
        <>
          <TableContainer>
            <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Cycle Start</TableCell>
                <TableCell align="center">Pre</TableCell>
                <TableCell align="center">Post</TableCell>
                <TableCell align="center">Improvement</TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
              {cycles.map((cycle) => (
                <>
                  <TableRow
                    key={cycle.cycle_start_date}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() =>
                      setExpandedCycle(
                        expandedCycle === cycle.cycle_start_date ? null : cycle.cycle_start_date,
                      )
                    }
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedCycle === cycle.cycle_start_date ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{formatDate(cycle.cycle_start_date)}</TableCell>
                    <TableCell align="center">
                      {cycle.pre_assessment ? (
                        <Chip
                          label={cycle.pre_assessment.score}
                          color={getScoreColor(cycle.pre_assessment.score)}
                          size="small"
                        />
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {cycle.post_assessment ? (
                        <Chip
                          label={cycle.post_assessment.score}
                          color={getScoreColor(cycle.post_assessment.score)}
                          size="small"
                        />
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{getImprovementChip(cycle.improvement)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ py: 0 }} colSpan={5}>
                      <Collapse
                        in={expandedCycle === cycle.cycle_start_date}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ py: 2 }}>
                          {/* Pre-Assessment Details */}
                          {cycle.pre_assessment && (
                            <Box
                              sx={{
                                mb: 2,
                                p: 2,
                                bgcolor: "grey.50",
                                borderRadius: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography variant="subtitle2">Pre-Assessment</Typography>
                                {canEdit && (
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(cycle.pre_assessment);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloneDialog(cycle.pre_assessment!);
                                      }}
                                    >
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(cycle.pre_assessment!.id);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                )}
                              </Box>
                              <Typography variant="body2">
                                <strong>Focus:</strong> {cycle.pre_assessment.teaching_focus}
                              </Typography>
                              {cycle.pre_assessment.focuses && cycle.pre_assessment.focuses.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {cycle.pre_assessment.focuses.map((focus, focusIndex) => (
                                    <Typography key={`${cycle.pre_assessment?.id}-focus-${focusIndex}`} variant="body2">
                                      <strong>Goal {focusIndex + 1}:</strong> {focus.goal} ({focus.score}/
                                      {focus.max_score})
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              <Typography variant="body2">
                                <strong>Score:</strong> {cycle.pre_assessment.score}/20
                              </Typography>
                              {cycle.pre_assessment.notes && (
                                <Typography variant="body2">
                                  <strong>Notes:</strong> {cycle.pre_assessment.notes}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                By {cycle.pre_assessment.teacher?.name || "Teacher"} on{" "}
                                {formatDate(cycle.pre_assessment.assessed_at)}
                              </Typography>
                            </Box>
                          )}

                          {/* Post-Assessment Details */}
                          {cycle.post_assessment && (
                            <Box
                              sx={{
                                p: 2,
                                bgcolor: "grey.50",
                                borderRadius: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography variant="subtitle2">Post-Assessment</Typography>
                                {canEdit && (
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(cycle.post_assessment);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloneDialog(cycle.post_assessment!);
                                      }}
                                    >
                                      <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(cycle.post_assessment!.id);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                )}
                              </Box>
                              <Typography variant="body2">
                                <strong>Focus:</strong> {cycle.post_assessment.teaching_focus}
                              </Typography>
                              {cycle.post_assessment.focuses && cycle.post_assessment.focuses.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {cycle.post_assessment.focuses.map((focus, focusIndex) => (
                                    <Typography key={`${cycle.post_assessment?.id}-focus-${focusIndex}`} variant="body2">
                                      <strong>Goal {focusIndex + 1}:</strong> {focus.goal} ({focus.score}/
                                      {focus.max_score})
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              <Typography variant="body2">
                                <strong>Score:</strong> {cycle.post_assessment.score}/20
                              </Typography>
                              {cycle.post_assessment.notes && (
                                <Typography variant="body2">
                                  <strong>Notes:</strong> {cycle.post_assessment.notes}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                By {cycle.post_assessment.teacher?.name || "Teacher"} on{" "}
                                {formatDate(cycle.post_assessment.assessed_at)}
                              </Typography>
                            </Box>
                          )}

                          {/* Missing assessments */}
                          {!cycle.pre_assessment && canAdd && (
                            <Alert severity="info" sx={{ mb: 1 }}>
                              Pre-assessment not recorded.{" "}
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCycleStartDate(cycle.cycle_start_date);
                                  setAssessmentType("pre");
                                  handleOpenDialog();
                                }}
                              >
                                Add Pre-Assessment
                              </Button>
                            </Alert>
                          )}
                          {!cycle.post_assessment && cycle.pre_assessment && canAdd && (
                            <Alert severity="info">
                              Post-assessment not recorded.{" "}
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCycleStartDate(cycle.cycle_start_date);
                                  setAssessmentType("post");
                                  handleOpenDialog();
                                }}
                              >
                                Add Post-Assessment
                              </Button>
                            </Alert>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
              </TableBody>
            </Table>
          </TableContainer>
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
        </>
      )}

      {/* Add/Edit Assessment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAssessment ? "Edit Assessment" : cloningAssessmentId ? "Clone Assessment" : "Add Assessment"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Cycle Start Date"
              type="date"
              value={cycleStartDate}
              onChange={(e) =>
                setCycleStartDate((e.target as unknown as { value: string }).value)
              }
              disabled={!!editingAssessment}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              select
              label="Assessment Type"
              value={assessmentType}
              onChange={(e) =>
                setAssessmentType((e.target as unknown as { value: "pre" | "post" }).value)
              }
              disabled={!!editingAssessment}
              fullWidth
            >
              <MenuItem value="pre">Pre-Assessment</MenuItem>
              <MenuItem value="post">Post-Assessment</MenuItem>
            </TextField>

            <TextField
              select
              label="Legacy Focus Summary"
              value={teachingFocus}
              onChange={(e) => setTeachingFocus((e.target as unknown as { value: string }).value)}
              fullWidth
              helperText="Auto-generated from focus goals below when goals are provided"
            >
              {TEACHING_FOCUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Teaching Focuses (up to 4)</Typography>
              {focuses.map((focus, index) => (
                <Box key={`focus-${index}`} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 1 }}>
                  <TextField
                    label={`Goal ${index + 1}`}
                    value={focus.goal}
                    onChange={(e) => {
                      const next = [...focuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        goal: (e.target as unknown as { value: string }).value,
                      };
                      setFocuses(next);
                    }}
                    fullWidth
                  />
                  <TextField
                    type="number"
                    label="Score"
                    value={focus.score}
                    onChange={(e) => {
                      const next = [...focuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        score: Number((e.target as unknown as { value: string }).value),
                      };
                      setFocuses(next);
                    }}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    type="number"
                    label="Max"
                    value={focus.max_score}
                    onChange={(e) => {
                      const next = [...focuses];
                      const current = next[index] ?? { goal: "", score: 0, max_score: 10 };
                      next[index] = {
                        ...current,
                        max_score: Number((e.target as unknown as { value: string }).value),
                      };
                      setFocuses(next);
                    }}
                    inputProps={{ min: 1 }}
                  />
                  <Button
                    color="error"
                    onClick={() => {
                      if (focuses.length === 1) {
                        setFocuses([{ goal: "", score: 0, max_score: 10 }]);
                        return;
                      }
                      setFocuses(focuses.filter((_, focusIndex) => focusIndex !== index));
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Box>
                <Button
                  size="small"
                  onClick={() => {
                    if (focuses.length >= 4) return;
                    setFocuses([...focuses, { goal: "", score: 0, max_score: 10 }]);
                  }}
                  disabled={focuses.length >= 4}
                >
                  Add Focus
                </Button>
              </Box>
            </Stack>

            <Box>
              <Typography gutterBottom>Score: {score}/20</Typography>
              <Slider
                value={score}
                onChange={(_, value) => setScore(value as number)}
                min={0}
                max={20}
                step={1}
                marks={[
                  { value: 0, label: "0" },
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 15, label: "15" },
                  { value: 20, label: "20" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes((e.target as unknown as { value: string }).value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              !cycleStartDate ||
              sanitizedFocuses.length === 0 ||
              hasInvalidFocuses ||
              createMutation.isPending ||
              updateMutation.isPending ||
              cloneMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending || cloneMutation.isPending ? (
              <CircularProgress size={20} />
            ) : editingAssessment ? (
              "Update"
            ) : cloningAssessmentId ? (
              "Clone"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
