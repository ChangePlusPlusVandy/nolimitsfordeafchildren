"use client";

import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Stack } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/(auth)/_domain/client";
import { AssessmentsSection } from "@/(dashboard)/(assessments)/_domain/ui";
import { UploadDocumentModal } from "@/(dashboard)/(documents)/_domain/ui";
import { NotesSection } from "@/(dashboard)/(notes)/_domain/ui";
import ConfirmDialog from "@/_shared/ui/ConfirmDialog";
import ErrorAlert from "@/_shared/ui/ErrorAlert";
import PageContainer from "@/_shared/ui/PageContainer";
import PageHeader from "@/_shared/ui/PageHeader";
import { DetailPageSkeleton } from "@/_shared/ui/skeletons";
import { useToast } from "@/_shared/ui/ToastProvider";

import {
  type AddSiblingInput,
  addSiblingToStudent,
  getStudentDetails,
  removeSiblingFromStudent,
  type Sibling,
  type UpdateSiblingInput,
  updateSiblingOfStudent,
} from "../_domain/client";
import LinksSection from "../_links/LinksSection";
import LinkParentModal from "../_links/parents/LinkParentModal";
import LinkTeacherModal from "../_links/teachers/LinkTeacherModal";
import AddSiblingModal from "../_siblings/AddSiblingModal";
import SiblingsSection from "../_siblings/SiblingsSection";
import AttendanceSection from "./AttendanceSection";
import DocumentsSection from "./DocumentsSection";
import ScheduleSection from "./ScheduleSection";
import StudentHeader from "./StudentHeader";

interface StudentDetailViewProps {
  studentId: string;
  mode: "admin" | "teacher";
  backHref: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function StudentDetailView({
  studentId,
  mode,
  backHref,
  breadcrumbs: breadcrumbsProp,
}: StudentDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [editingSibling, setEditingSibling] = useState<Sibling | null>(null);
  const [linkTeacherModalOpen, setLinkTeacherModalOpen] = useState(false);
  const [linkParentModalOpen, setLinkParentModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"pre_report" | "graduation_speech" | null>(null);
  const [removeSiblingId, setRemoveSiblingId] = useState<string | null>(null);

  const queryKey =
    mode === "teacher"
      ? (["students", "show", studentId, "teacher-scope"] as const)
      : (["students", "show", studentId] as const);

  const {
    data: student,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getStudentDetails(studentId),
    enabled: !!studentId,
  });

  const addSiblingMutation = useMutation({
    mutationFn: (data: AddSiblingInput & { studentId: string }) => addSiblingToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      setSiblingModalOpen(false);
      toast.success("Sibling added successfully");
    },
    onError: () => {
      toast.error("Failed to add sibling. Please try again.");
    },
  });

  const updateSiblingMutation = useMutation({
    mutationFn: (data: UpdateSiblingInput & { id: string }) => updateSiblingOfStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      setEditingSibling(null);
      toast.success("Sibling updated successfully");
    },
    onError: () => {
      toast.error("Failed to update sibling. Please try again.");
    },
  });

  const removeSiblingMutation = useMutation({
    mutationFn: (siblingId: string) => removeSiblingFromStudent(siblingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", studentId] });
      setRemoveSiblingId(null);
      toast.success("Sibling removed");
    },
    onError: () => {
      setRemoveSiblingId(null);
      toast.error("Failed to remove sibling. Please try again.");
    },
  });

  const handleAddSibling = (data: AddSiblingInput) => {
    addSiblingMutation.mutate({ ...data, studentId });
  };

  const handleUpdateSibling = (data: UpdateSiblingInput) => {
    if (editingSibling) {
      updateSiblingMutation.mutate({ ...data, id: editingSibling.id });
    }
  };

  const openUpload = (type?: "pre_report" | "graduation_speech") => {
    setUploadType(type ?? null);
    setUploadModalOpen(true);
  };

  const breadcrumbs =
    breadcrumbsProp ??
    (mode === "teacher"
      ? [{ label: "My Day", href: "/my-day" }, { label: "Student Details" }]
      : [
          { label: "Students", href: "/students" },
          {
            label: student
              ? isAdmin
                ? `${student.first_name} ${student.last_name}`
                : student.initials
              : "Details",
          },
        ]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Student Details" breadcrumbs={breadcrumbs} back={backHref} />
        <DetailPageSkeleton sections={4} />
      </PageContainer>
    );
  }

  if (error || !student) {
    return (
      <PageContainer>
        <PageHeader title="Student Details" breadcrumbs={breadcrumbs} back={backHref} />
        <ErrorAlert message="Student not found or access denied." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const studentDisplayName = `${student.first_name} ${student.last_name}`;
  const attendanceOverview = student.attendance_overview;

  if (mode === "teacher") {
    return (
      <PageContainer>
        <PageHeader title="Student Details" back={backHref} breadcrumbs={breadcrumbs} />

        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              <StudentHeader student={student} studentId={studentId} mode="teacher" />
              <DocumentsSection studentId={studentId} mode="teacher" onUpload={openUpload} />
              <NotesSection studentId={studentId} mode="teacher" />
              <AssessmentsSection studentId={studentId} mode="teacher" />
            </Stack>
          </Box>

          <Box sx={{ width: { xs: "100%", lg: 360 } }}>
            <AttendanceSection
              studentId={studentId}
              attendanceOverview={attendanceOverview}
              mode="teacher"
            />
          </Box>
        </Box>

        <UploadDocumentModal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadType(null);
          }}
          studentId={studentId}
          studentName={studentDisplayName}
          defaultDocumentType={uploadType ?? undefined}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Student Details"
        breadcrumbs={breadcrumbs}
        back={backHref}
        actions={
          isAdmin ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/students/${studentId}/edit`)}
            >
              Edit
            </Button>
          ) : undefined
        }
      />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            <StudentHeader
              student={student}
              studentId={studentId}
              mode="admin"
              onEdit={isAdmin ? () => router.push(`/students/${studentId}/edit`) : undefined}
            />
            <ScheduleSection student={student} />
            <SiblingsSection
              siblings={student.siblings}
              canManage={isAdmin}
              onAdd={() => setSiblingModalOpen(true)}
              onEdit={setEditingSibling}
              onRemove={setRemoveSiblingId}
            />
          </Stack>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            {isAdmin && (
              <LinksSection
                studentId={studentId}
                parents={student.parents ?? []}
                onLinkTeacher={() => setLinkTeacherModalOpen(true)}
                onLinkParent={() => setLinkParentModalOpen(true)}
              />
            )}

            <DocumentsSection studentId={studentId} mode="admin" onUpload={openUpload} />

            {attendanceOverview && (
              <AttendanceSection
                studentId={studentId}
                attendanceOverview={attendanceOverview}
                mode="admin"
              />
            )}

            <NotesSection studentId={studentId} mode="admin" />
            <AssessmentsSection studentId={studentId} mode="admin" />
          </Stack>
        </Box>
      </Box>

      <AddSiblingModal
        open={siblingModalOpen}
        onClose={() => setSiblingModalOpen(false)}
        onSave={handleAddSibling}
        isLoading={addSiblingMutation.isPending}
      />

      {editingSibling && (
        <AddSiblingModal
          open={!!editingSibling}
          onClose={() => setEditingSibling(null)}
          onSave={handleUpdateSibling}
          initialData={editingSibling}
          isLoading={updateSiblingMutation.isPending}
          title="Edit Sibling"
        />
      )}

      <ConfirmDialog
        open={!!removeSiblingId}
        title="Remove sibling?"
        message="Are you sure you want to remove this sibling? This action cannot be undone."
        confirmLabel="Remove"
        confirmColor="error"
        loading={removeSiblingMutation.isPending}
        onConfirm={() => {
          if (removeSiblingId) removeSiblingMutation.mutate(removeSiblingId);
        }}
        onCancel={() => setRemoveSiblingId(null)}
      />

      <LinkTeacherModal
        open={linkTeacherModalOpen}
        onClose={() => setLinkTeacherModalOpen(false)}
        studentId={studentId}
        studentName={studentDisplayName}
      />

      <LinkParentModal
        open={linkParentModalOpen}
        onClose={() => setLinkParentModalOpen(false)}
        studentId={studentId}
        studentName={studentDisplayName}
      />

      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        studentId={studentId}
        studentName={studentDisplayName}
      />
    </PageContainer>
  );
}
