"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { updateAttendance } from "@/client/attendance";
import { useAuth } from "@/client/auth";
import ConfirmDialog from "@/client/components/ConfirmDialog";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { DetailPageSkeleton } from "@/client/components/skeletons";
import AddSiblingModal from "@/client/components/students/AddSiblingModal";
import AssessmentHistory from "@/client/components/students/AssessmentHistory";
import DocumentList from "@/client/components/students/DocumentList";
import LinkParentModal from "@/client/components/students/LinkParentModal";
import LinkTeacherModal from "@/client/components/students/LinkTeacherModal";
import SessionNotes from "@/client/components/students/SessionNotes";
import SiblingAvatars from "@/client/components/students/SiblingAvatars";
import UploadDocumentModal from "@/client/components/students/UploadDocumentModal";
import { useToast } from "@/client/components/ToastProvider";
import {
  type AddSiblingInput,
  addSiblingToStudent,
  getStudentDetails,
  removeSiblingFromStudent,
  type Sibling,
  type UpdateSiblingInput,
  updateSiblingOfStudent,
} from "@/client/students";
import { formatDate, formatDateTime, formatTime } from "@/client/utils/formatDate";

type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

const ABSENCE_REASON_OPTIONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "transportation", label: "Transportation" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "no_show_unknown", label: "No-show (Unknown)" },
  { value: "other", label: "Other" },
];

function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 1) days.push("Sun");
  if (mask & 2) days.push("Mon");
  if (mask & 4) days.push("Tue");
  if (mask & 8) days.push("Wed");
  if (mask & 16) days.push("Thu");
  if (mask & 32) days.push("Fri");
  if (mask & 64) days.push("Sat");
  return days;
}

function formatHearingLossType(value: string | null): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, isTeacher } = useAuth();
  const toast = useToast();

  // Modal states
  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [editingSibling, setEditingSibling] = useState<Sibling | null>(null);
  const [linkTeacherModalOpen, setLinkTeacherModalOpen] = useState(false);
  const [linkParentModalOpen, setLinkParentModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [editingAttendanceStatus, setEditingAttendanceStatus] =
    useState<AttendanceStatus>("present");
  const [editingAttendanceLateMinutes, setEditingAttendanceLateMinutes] = useState(10);
  const [editingAttendanceReason, setEditingAttendanceReason] = useState<AbsenceReason | "">("");
  const [editingAttendanceReasonText, setEditingAttendanceReasonText] = useState("");

  // ConfirmDialog state for sibling removal
  const [removeSiblingId, setRemoveSiblingId] = useState<string | null>(null);

  // Fetch student details
  const {
    data: student,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["students", "show", id],
    queryFn: () => getStudentDetails(id),
    enabled: !!id,
  });

  // Add sibling mutation
  const addSiblingMutation = useMutation({
    mutationFn: (data: AddSiblingInput & { studentId: string }) => addSiblingToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", id] });
      setSiblingModalOpen(false);
      toast.success("Sibling added successfully");
    },
    onError: () => {
      toast.error("Failed to add sibling. Please try again.");
    },
  });

  // Update sibling mutation
  const updateSiblingMutation = useMutation({
    mutationFn: (data: UpdateSiblingInput & { id: string }) => updateSiblingOfStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", id] });
      setEditingSibling(null);
      toast.success("Sibling updated successfully");
    },
    onError: () => {
      toast.error("Failed to update sibling. Please try again.");
    },
  });

  // Remove sibling mutation
  const removeSiblingMutation = useMutation({
    mutationFn: (siblingId: string) => removeSiblingFromStudent(siblingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", id] });
      setRemoveSiblingId(null);
      toast.success("Sibling removed");
    },
    onError: () => {
      setRemoveSiblingId(null);
      toast.error("Failed to remove sibling. Please try again.");
    },
  });

  const patchAttendanceMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "show", id] });
      setAttendanceDialogOpen(false);
      setEditingAttendanceId(null);
      setEditingAttendanceStatus("present");
      setEditingAttendanceLateMinutes(10);
      setEditingAttendanceReason("");
      setEditingAttendanceReasonText("");
      toast.success("Attendance updated");
    },
    onError: () => {
      toast.error("Failed to update attendance");
    },
  });

  const handleAddSibling = (data: AddSiblingInput) => {
    addSiblingMutation.mutate({ ...data, studentId: id });
  };

  const handleUpdateSibling = (data: UpdateSiblingInput) => {
    if (editingSibling) {
      updateSiblingMutation.mutate({ ...data, id: editingSibling.id });
    }
  };

  const handleRemoveSibling = (siblingId: string) => {
    setRemoveSiblingId(siblingId);
  };

  const openAttendanceDialog = (entry: {
    id: string;
    status: AttendanceStatus;
    late_minutes: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
  }) => {
    setEditingAttendanceId(entry.id);
    setEditingAttendanceStatus(entry.status);
    setEditingAttendanceLateMinutes(entry.late_minutes ?? 10);
    setEditingAttendanceReason(entry.reason || "");
    setEditingAttendanceReasonText(entry.reason_text || "");
    setAttendanceDialogOpen(true);
  };

  const handleAttendanceUpdate = () => {
    if (!editingAttendanceId) {
      return;
    }

    const requiresReason =
      editingAttendanceStatus === "no_show" || editingAttendanceStatus === "cancelled";
    if (requiresReason && !editingAttendanceReason) {
      return;
    }

    if (editingAttendanceReason === "other" && !editingAttendanceReasonText.trim()) {
      return;
    }

    patchAttendanceMutation.mutate({
      id: editingAttendanceId,
      status: editingAttendanceStatus,
      late_minutes: editingAttendanceStatus === "late" ? editingAttendanceLateMinutes : undefined,
      reason: requiresReason ? (editingAttendanceReason as AbsenceReason) : undefined,
      reason_text:
        editingAttendanceReason === "other" ? editingAttendanceReasonText.trim() : undefined,
    });
  };

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const breadcrumbs = [
    { label: "Students", href: "/students" },
    {
      label: student
        ? isAdmin
          ? `${student.first_name} ${student.last_name}`
          : student.initials
        : "Details",
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Student Details" breadcrumbs={breadcrumbs} back="/students" />
        <DetailPageSkeleton sections={4} />
      </PageContainer>
    );
  }

  if (error || !student) {
    return (
      <PageContainer>
        <PageHeader title="Student Details" breadcrumbs={breadcrumbs} back="/students" />
        <ErrorAlert
          message={error instanceof Error ? error.message : "Student not found"}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const attendanceOverview = student.attendance_overview;

  const attendanceStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "success";
      case "late":
        return "warning";
      case "no_show":
        return "error";
      default:
        return "default";
    }
  };

  const formatRoleLabel = (role: "administrator" | "teacher" | "parent" | "unassigned") => {
    if (role === "administrator") return "Admin";
    if (role === "teacher") return "Teacher";
    if (role === "unassigned") return "Pending";
    return "Parent";
  };

  return (
    <PageContainer>
      <PageHeader
        title="Student Details"
        breadcrumbs={breadcrumbs}
        back="/students"
        actions={
          isAdmin ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/students/${id}/edit`)}
            >
              Edit
            </Button>
          ) : undefined
        }
      />

      {/* Main Content Grid */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Left Column - Profile Info */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            {/* Profile Card */}
            <SectionCard>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
                <Avatar
                  src={student.photo_url || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "primary.main",
                    fontSize: "1.75rem",
                  }}
                >
                  {student.initials}
                </Avatar>
                <Box>
                  {isAdmin ? (
                    <>
                      <Typography variant="h5">
                        {student.first_name} {student.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Initials: {student.initials}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="h5">{student.initials}</Typography>
                  )}
                  <Chip
                    label={student.is_active ? "Active" : "Inactive"}
                    color={student.is_active ? "success" : "default"}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Details */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography>
                    {formatDate(student.dob)} (Age: {calculateAge(student.dob)})
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                    Site
                  </Typography>
                  <Typography>
                    {student.site?.name || "Not assigned"}{" "}
                    {student.site?.type && (
                      <Chip
                        label={student.site.type.replace("_", " ")}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>

                {student.current_school && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                      Current School
                    </Typography>
                    <Typography>{student.current_school}</Typography>
                  </Box>
                )}

                {student.preferred_language && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Preferred Language
                    </Typography>
                    <Typography>{student.preferred_language}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hearing Devices
                  </Typography>
                  <Typography>
                    {student.hearing_devices.length > 0
                      ? student.hearing_devices.join(", ")
                      : "Not specified"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hearing Loss Type
                  </Typography>
                  <Typography>{formatHearingLossType(student.hearing_loss_type)}</Typography>
                </Box>

                {student.guardian_summary && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Guardian Summary
                    </Typography>
                    <Typography>{student.guardian_summary}</Typography>
                  </Box>
                )}
              </Box>
            </SectionCard>

            {/* Schedule History */}
            <SectionCard title="Schedule History" icon={<ScheduleIcon />}>
              {(student.schedule_history?.length || 0) > 0 ? (
                <List dense sx={{ p: 0 }}>
                  {student.schedule_history?.map((entry, index) => (
                    <Box key={entry.enrollment_id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography variant="body1">
                                {decodeDayMask(entry.schedule.day_of_week_mask).join("/")} at{" "}
                                {formatTime(entry.schedule.start_time)}
                              </Typography>
                              {entry.is_current && (
                                <Chip size="small" label="Current" color="primary" />
                              )}
                              {entry.schedule.session?.name && (
                                <Chip
                                  size="small"
                                  label={entry.schedule.session.name}
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {entry.schedule.site.name} with {entry.schedule.teacher.name}
                              <br />
                              Cycle: {formatDate(entry.schedule.cycle_start_date)} to{" "}
                              {formatDate(entry.schedule.cycle_end_date)}
                              <br />
                              Enrollment: {formatDate(entry.enrolled_at)}
                              {entry.ended_at ? ` to ${formatDate(entry.ended_at)}` : " to present"}
                            </>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No schedule history recorded.</Typography>
              )}
            </SectionCard>

            {/* Siblings Section */}
            <SectionCard
              title="Siblings"
              icon={<FamilyRestroomIcon />}
              actions={
                isAdmin ? (
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setSiblingModalOpen(true)}
                  >
                    Add Sibling
                  </Button>
                ) : undefined
              }
            >
              {student.siblings.length > 0 ? (
                <>
                  <SiblingAvatars
                    siblings={student.siblings}
                    onEdit={isAdmin ? setEditingSibling : undefined}
                    onDelete={isAdmin ? handleRemoveSibling : undefined}
                  />
                  <List dense>
                    {student.siblings.map((sibling) => (
                      <ListItem
                        key={sibling.id}
                        secondaryAction={
                          isAdmin && (
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => setEditingSibling(sibling)}
                                aria-label={`Edit sibling ${sibling.name}`}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveSibling(sibling.id)}
                                aria-label={`Remove sibling ${sibling.name}`}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "secondary.main" }}>
                            {sibling.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={sibling.name}
                          secondary={`${sibling.relationship}${sibling.age ? `, Age ${sibling.age}` : ""} • ${sibling.is_participant ? "Participant" : "Not participant"} • ${sibling.has_hearing_loss ? "Has hearing loss" : "No hearing loss"}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No siblings recorded
                </Typography>
              )}
            </SectionCard>
          </Stack>
        </Box>

        {/* Right Column - Linked People & Documents */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            {/* Linked Teachers */}
            <SectionCard
              title="Linked Teachers"
              icon={<SchoolIcon />}
              actions={
                isAdmin ? (
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkTeacherModalOpen(true)}
                  >
                    Link Teacher
                  </Button>
                ) : undefined
              }
            >
              {student.teachers.length > 0 ? (
                <List dense>
                  {student.teachers.map((teacher) => (
                    <ListItem key={teacher.link_id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "info.main" }}>{teacher.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={teacher.name} secondary={teacher.email} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No teachers linked
                </Typography>
              )}
            </SectionCard>

            {/* Linked Parents */}
            <SectionCard
              title="Linked Parents"
              icon={<FamilyRestroomIcon />}
              actions={
                isAdmin ? (
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkParentModalOpen(true)}
                  >
                    Link Parent
                  </Button>
                ) : undefined
              }
            >
              {student.parents.length > 0 ? (
                <List dense>
                  {student.parents.map((parent) => (
                    <ListItem key={parent.link_id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "warning.main" }}>{parent.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {parent.name}
                            {parent.is_primary && (
                              <Chip label="Primary" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            {parent.relationship && `${parent.relationship} - `}
                            {parent.email}
                            {parent.phone && ` - ${parent.phone}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No parents linked
                </Typography>
              )}
            </SectionCard>

            {/* Documents Section */}
            <SectionCard
              title="Documents"
              icon={<DescriptionIcon />}
              actions={
                isAdmin ? (
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setUploadModalOpen(true)}
                  >
                    Upload
                  </Button>
                ) : undefined
              }
            >
              <DocumentList
                studentId={id}
                canDelete={isAdmin}
                onUploadClick={() => setUploadModalOpen(true)}
              />
            </SectionCard>

            {/* Attendance Overview */}
            {attendanceOverview && (
              <SectionCard title="Attendance" icon={<EventAvailableIcon />}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Chip
                    label={`Present: ${attendanceOverview.present}`}
                    color="success"
                    size="small"
                  />
                  <Chip label={`Late: ${attendanceOverview.late}`} color="warning" size="small" />
                  <Chip
                    label={`No-show: ${attendanceOverview.no_show}`}
                    color="error"
                    size="small"
                  />
                  <Chip label={`Cancelled: ${attendanceOverview.cancelled}`} size="small" />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Attendance rate: {attendanceOverview.attendance_rate}% ({attendanceOverview.total}{" "}
                  total)
                </Typography>

                {attendanceOverview.recent_entries.length > 0 ? (
                  <List dense sx={{ p: 0 }}>
                    {attendanceOverview.recent_entries.map((entry, index) => (
                      <Box key={entry.id}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={formatDate(entry.session_date)}
                            secondary={
                              <>
                                <Chip
                                  label={entry.status.replace("_", " ")}
                                  size="small"
                                  color={attendanceStatusColor(entry.status)}
                                  sx={{ mr: 1, textTransform: "capitalize" }}
                                />
                                {entry.reason && `Reason: ${entry.reason.replace(/_/g, " ")}`}
                                {entry.late_minutes && `Late by ${entry.late_minutes} min`}
                                {entry.reason_text && ` (${entry.reason_text})`}
                                {entry.marked_by && (
                                  <>
                                    {" "}
                                    - Marked by {entry.marked_by.name} (
                                    {formatRoleLabel(entry.marked_by.role)}) on{" "}
                                    {formatDateTime(entry.marked_at)}
                                  </>
                                )}
                              </>
                            }
                          />
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={() => openAttendanceDialog(entry)}
                              aria-label="Edit attendance"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No attendance records yet.</Typography>
                )}
              </SectionCard>
            )}

            {/* Session Notes */}
            <SessionNotes studentId={id} canAdd={isTeacher} canEdit={isTeacher} />

            {/* Assessments */}
            <AssessmentHistory studentId={id} canAdd={isTeacher} canEdit={isTeacher} />
          </Stack>
        </Box>
      </Box>

      {/* Add Sibling Modal */}
      <AddSiblingModal
        open={siblingModalOpen}
        onClose={() => setSiblingModalOpen(false)}
        onSave={handleAddSibling}
        isLoading={addSiblingMutation.isPending}
      />

      {/* Edit Sibling Modal */}
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

      {/* Remove Sibling Confirm Dialog */}
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

      {/* Link Teacher Modal */}
      <LinkTeacherModal
        open={linkTeacherModalOpen}
        onClose={() => setLinkTeacherModalOpen(false)}
        studentId={id}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />

      {/* Link Parent Modal */}
      <LinkParentModal
        open={linkParentModalOpen}
        onClose={() => setLinkParentModalOpen(false)}
        studentId={id}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        studentId={id}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />

      <Dialog
        open={attendanceDialogOpen}
        onClose={() => setAttendanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Attendance</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editingAttendanceStatus}
                label="Status"
                onChange={(event) => {
                  const value = (event.target as unknown as { value: AttendanceStatus }).value;
                  setEditingAttendanceStatus(value);
                  if (value !== "late") {
                    setEditingAttendanceLateMinutes(10);
                  }
                  if (value === "present" || value === "late") {
                    setEditingAttendanceReason("");
                    setEditingAttendanceReasonText("");
                  }
                }}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {editingAttendanceStatus === "late" && (
              <FormControl fullWidth>
                <InputLabel>Late By</InputLabel>
                <Select
                  value={String(editingAttendanceLateMinutes)}
                  label="Late By"
                  onChange={(event) =>
                    setEditingAttendanceLateMinutes(
                      Number((event.target as unknown as { value: string }).value),
                    )
                  }
                >
                  <MenuItem value="10">10 minutes</MenuItem>
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                </Select>
              </FormControl>
            )}

            {(editingAttendanceStatus === "no_show" || editingAttendanceStatus === "cancelled") && (
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={editingAttendanceReason}
                  label="Reason"
                  onChange={(event) =>
                    setEditingAttendanceReason(
                      (event.target as unknown as { value: AbsenceReason | "" }).value,
                    )
                  }
                >
                  {ABSENCE_REASON_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {editingAttendanceReason === "other" && (
              <TextField
                label="Reason Details"
                value={editingAttendanceReasonText}
                onChange={(event) =>
                  setEditingAttendanceReasonText(
                    (event.target as unknown as { value: string }).value,
                  )
                }
                multiline
                minRows={2}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAttendanceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAttendanceUpdate}
            disabled={
              patchAttendanceMutation.isPending ||
              ((editingAttendanceStatus === "no_show" || editingAttendanceStatus === "cancelled") &&
                !editingAttendanceReason) ||
              (editingAttendanceReason === "other" && !editingAttendanceReasonText.trim())
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
