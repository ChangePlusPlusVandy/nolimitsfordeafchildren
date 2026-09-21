"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { Fragment } from "react";

import type { Assessment } from "@/client/assessments";
import { formatDate } from "@/client/utils/formatDate";

export interface AssessmentCycleRow {
  cycle_start_date: string;
  pre_assessment?: Assessment | null;
  post_assessment?: Assessment | null;
  improvement?: number;
}

interface AssessmentHistoryTableProps {
  cycles: AssessmentCycleRow[];
  total: number;
  page: number;
  rowsPerPage: number;
  expandedCycle: string | null;
  canAdd: boolean;
  canEdit: boolean;
  onToggleCycle: (cycleStartDate: string) => void;
  onEdit: (assessment: Assessment) => void;
  onClone: (assessment: Assessment) => void;
  onDelete: (assessmentId: string) => void;
  onAddPre: (cycleStartDate: string) => void;
  onAddPost: (cycleStartDate: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

function getScoreColor(value: number) {
  if (value >= 15) return "success";
  if (value >= 10) return "warning";
  return "error";
}

function getImprovementChip(improvement: number | undefined) {
  if (improvement === undefined) return null;
  if (improvement > 0) {
    return (
      <Chip icon={<TrendingUpIcon />} label={`+${improvement}`} color="success" size="small" />
    );
  }
  if (improvement < 0) {
    return (
      <Chip icon={<TrendingDownIcon />} label={improvement.toString()} color="error" size="small" />
    );
  }
  return <Chip label="No change" size="small" variant="outlined" />;
}

export default function AssessmentHistoryTable({
  cycles,
  total,
  page,
  rowsPerPage,
  expandedCycle,
  canAdd,
  canEdit,
  onToggleCycle,
  onEdit,
  onClone,
  onDelete,
  onAddPre,
  onAddPost,
  onPageChange,
  onRowsPerPageChange,
}: AssessmentHistoryTableProps) {
  return (
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
              <Fragment key={cycle.cycle_start_date}>
                <TableRow
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => onToggleCycle(cycle.cycle_start_date)}
                >
                  <TableCell>
                    <IconButton
                      size="small"
                      aria-label={
                        expandedCycle === cycle.cycle_start_date
                          ? "Collapse cycle details"
                          : "Expand cycle details"
                      }
                    >
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
                        {cycle.pre_assessment && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
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
                                      onEdit(cycle.pre_assessment as Assessment);
                                    }}
                                    aria-label="Edit pre-assessment"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClone(cycle.pre_assessment as Assessment);
                                    }}
                                    aria-label="Clone pre-assessment"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete((cycle.pre_assessment as Assessment).id);
                                    }}
                                    aria-label="Delete pre-assessment"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              )}
                            </Box>
                            <Typography variant="body2">
                              <strong>Focus:</strong> {cycle.pre_assessment.teaching_focus}
                            </Typography>
                            {cycle.pre_assessment.focuses &&
                              cycle.pre_assessment.focuses.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {cycle.pre_assessment.focuses.map((focus, focusIndex) => (
                                    <Typography
                                      key={`${cycle.pre_assessment?.id}-focus-${focus.goal}`}
                                      variant="body2"
                                    >
                                      <strong>Goal {focusIndex + 1}:</strong> {focus.goal} (
                                      {focus.score}/{focus.max_score})
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

                        {cycle.post_assessment && (
                          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
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
                                      onEdit(cycle.post_assessment as Assessment);
                                    }}
                                    aria-label="Edit post-assessment"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClone(cycle.post_assessment as Assessment);
                                    }}
                                    aria-label="Clone post-assessment"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete((cycle.post_assessment as Assessment).id);
                                    }}
                                    aria-label="Delete post-assessment"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              )}
                            </Box>
                            <Typography variant="body2">
                              <strong>Focus:</strong> {cycle.post_assessment.teaching_focus}
                            </Typography>
                            {cycle.post_assessment.focuses &&
                              cycle.post_assessment.focuses.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {cycle.post_assessment.focuses.map((focus, focusIndex) => (
                                    <Typography
                                      key={`${cycle.post_assessment?.id}-focus-${focus.goal}`}
                                      variant="body2"
                                    >
                                      <strong>Goal {focusIndex + 1}:</strong> {focus.goal} (
                                      {focus.score}/{focus.max_score})
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

                        {!cycle.pre_assessment && canAdd && (
                          <Alert severity="info" sx={{ mb: 1 }}>
                            Pre-assessment not recorded.{" "}
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddPre(cycle.cycle_start_date);
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
                                onAddPost(cycle.cycle_start_date);
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
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 20]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={Math.max(page - 1, 0)}
        onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(Number(event.target.value));
          onPageChange(1);
        }}
      />
    </>
  );
}
