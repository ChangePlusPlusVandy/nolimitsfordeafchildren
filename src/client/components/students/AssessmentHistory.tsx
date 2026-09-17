"use client";

import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  type Assessment,
  type AssessmentFocus,
  cloneAssessment,
  createAssessment,
  deleteAssessment,
  listAssessmentsForStudent,
  updateAssessment,
} from "@/client/assessments";
import ConfirmDialog from "@/client/components/ConfirmDialog";
import ErrorAlert from "@/client/components/ErrorAlert";
import SectionCard from "@/client/components/SectionCard";
import AssessmentFormDialog from "@/client/components/students/AssessmentFormDialog";
import AssessmentHistoryTable from "@/client/components/students/AssessmentHistoryTable";
import { useToast } from "@/client/components/ToastProvider";

interface AssessmentHistoryProps {
  studentId: string;
  canAdd?: boolean;
  canEdit?: boolean;
}

export default function AssessmentHistory({
  studentId,
  canAdd = false,
  canEdit = false,
}: AssessmentHistoryProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [cloningAssessmentId, setCloningAssessmentId] = useState<string | null>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [cycleStartDate, setCycleStartDate] = useState("");
  const [assessmentType, setAssessmentType] = useState<"pre" | "post">("pre");
  const [teachingFocus, setTeachingFocus] = useState("");
  const [score, setScore] = useState(10);
  const [notes, setNotes] = useState("");
  const [focuses, setFocuses] = useState<AssessmentFocus[]>([
    { goal: "", score: 0, max_score: 10 },
  ]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["assessments", studentId, page, rowsPerPage],
    queryFn: () => listAssessmentsForStudent(studentId, { page, limit: rowsPerPage }),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createAssessment>[1]) =>
      createAssessment(studentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      toast.success("Assessment created");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to create assessment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAssessment>[1] }) =>
      updateAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      toast.success("Assessment updated");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to update assessment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      toast.success("Assessment deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete assessment");
      setDeleteTarget(null);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: Parameters<typeof cloneAssessment>[1];
    }) => cloneAssessment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
      toast.success("Assessment cloned");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to clone assessment");
    },
  });

  const resetForm = () => {
    setCycleStartDate("");
    setAssessmentType("pre");
    setTeachingFocus("");
    setScore(10);
    setNotes("");
    setFocuses([{ goal: "", score: 0, max_score: 10 }]);
  };

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
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      setAssessmentType("pre");
      setTeachingFocus("");
      setScore(10);
      setNotes("");
      setFocuses([{ goal: "", score: 0, max_score: 10 }]);
      setCycleStartDate(monday.toISOString().split("T")[0] ?? "");
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
    resetForm();
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
    sanitizedFocuses.length > 0
      ? sanitizedFocuses.map((focus) => focus.goal).join(" | ")
      : teachingFocus;
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

  const cycles = data?.items ?? [];
  const dialogMode = editingAssessment ? "edit" : cloningAssessmentId ? "clone" : "create";
  const isSaving = createMutation.isPending || updateMutation.isPending || cloneMutation.isPending;

  return (
    <>
      <SectionCard
        title="Assessments"
        icon={<AssessmentIcon />}
        actions={
          canAdd ? (
            <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Assessment
            </Button>
          ) : undefined
        }
      >
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && <ErrorAlert message="Failed to load assessments." onRetry={() => refetch()} />}

        {!isLoading && !error && cycles.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No assessments recorded yet.
          </Typography>
        )}

        {cycles.length > 0 && (
          <AssessmentHistoryTable
            cycles={cycles}
            total={data?.total ?? 0}
            page={page}
            rowsPerPage={rowsPerPage}
            expandedCycle={expandedCycle}
            canAdd={canAdd}
            canEdit={canEdit}
            onToggleCycle={(cycleStartDate) =>
              setExpandedCycle(expandedCycle === cycleStartDate ? null : cycleStartDate)
            }
            onEdit={handleOpenDialog}
            onClone={handleCloneDialog}
            onDelete={setDeleteTarget}
            onAddPre={(cycleStartDate) => {
              setCycleStartDate(cycleStartDate);
              setAssessmentType("pre");
              handleOpenDialog();
            }}
            onAddPost={(cycleStartDate) => {
              setCycleStartDate(cycleStartDate);
              setAssessmentType("post");
              handleOpenDialog();
            }}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </SectionCard>

      <AssessmentFormDialog
        open={dialogOpen}
        mode={dialogMode}
        cycleStartDate={cycleStartDate}
        assessmentType={assessmentType}
        teachingFocus={teachingFocus}
        score={score}
        notes={notes}
        focuses={focuses}
        isSaving={isSaving}
        canSave={!!cycleStartDate && sanitizedFocuses.length > 0 && !hasInvalidFocuses}
        onClose={handleCloseDialog}
        onSave={handleSave}
        onCycleStartDateChange={setCycleStartDate}
        onAssessmentTypeChange={setAssessmentType}
        onTeachingFocusChange={setTeachingFocus}
        onScoreChange={setScore}
        onNotesChange={setNotes}
        onFocusesChange={setFocuses}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete assessment?"
        message="Are you sure you want to delete this assessment? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
