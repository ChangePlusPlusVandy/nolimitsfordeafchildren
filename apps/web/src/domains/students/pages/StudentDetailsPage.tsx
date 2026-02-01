import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Alert,
} from "@mui/material";
import { DetailPageSkeleton } from "../../global/components/skeletons";
import { useToast } from "../../global/components/ToastProvider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import { useStudentHttpService, type Sibling, type AddSiblingInput, type UpdateSiblingInput } from "../services/StudentHttpService";
import { useAuth } from "../../../auth";
import SiblingAvatars from "../components/SiblingAvatars";
import AddSiblingModal from "../components/AddSiblingModal";
import SessionNotes from "../components/SessionNotes";
import AssessmentHistory from "../components/AssessmentHistory";
import LinkTeacherModal from "./LinkTeacherModal";
import LinkParentModal from "./LinkParentModal";
import UploadDocumentModal from "./UploadDocumentModal";
import DocumentList from "../components/DocumentList";

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const { isAdmin, isTeacher } = useAuth();
  const toast = useToast();

  // Modal states
  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [editingSibling, setEditingSibling] = useState<Sibling | null>(null);
  const [linkTeacherModalOpen, setLinkTeacherModalOpen] = useState(false);
  const [linkParentModalOpen, setLinkParentModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch student details
  const { data: student, isLoading, error } = useQuery({
    queryKey: [studentHttpService.key, "show", id],
    queryFn: () => studentHttpService.queries.show(id!),
    enabled: !!id,
  });

  // Add sibling mutation
  const addSiblingMutation = useMutation({
    mutationFn: (data: AddSiblingInput & { studentId: string }) =>
      studentHttpService.mutations.addSibling(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", id] });
      setSiblingModalOpen(false);
      toast.success("Sibling added successfully");
    },
    onError: () => {
      toast.error("Failed to add sibling. Please try again.");
    },
  });

  // Update sibling mutation
  const updateSiblingMutation = useMutation({
    mutationFn: (data: UpdateSiblingInput & { id: string }) =>
      studentHttpService.mutations.updateSibling(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", id] });
      setEditingSibling(null);
      toast.success("Sibling updated successfully");
    },
    onError: () => {
      toast.error("Failed to update sibling. Please try again.");
    },
  });

  // Remove sibling mutation
  const removeSiblingMutation = useMutation({
    mutationFn: (siblingId: string) => studentHttpService.mutations.removeSibling(siblingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", id] });
      toast.success("Sibling removed");
    },
    onError: () => {
      toast.error("Failed to remove sibling. Please try again.");
    },
  });

  const handleAddSibling = (data: AddSiblingInput) => {
    addSiblingMutation.mutate({ ...data, studentId: id! });
  };

  const handleUpdateSibling = (data: UpdateSiblingInput) => {
    if (editingSibling) {
      updateSiblingMutation.mutate({ ...data, id: editingSibling.id });
    }
  };

  const handleRemoveSibling = (siblingId: string) => {
    if (confirm("Are you sure you want to remove this sibling?")) {
      removeSiblingMutation.mutate(siblingId);
    }
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

  if (isLoading) {
    return <DetailPageSkeleton sections={4} />;
  }

  if (error || !student) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">
          {error instanceof Error ? error.message : "Student not found"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
          Student Details
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/students/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Left Column - Profile Info */}
        <Box sx={{ flex: 1 }}>
          {/* Profile Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
              <Avatar
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
                  {new Date(student.dob).toLocaleDateString()} (Age: {calculateAge(student.dob)})
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
                    <Chip label={student.site.type.replace("_", " ")} size="small" sx={{ ml: 1 }} />
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

              {student.guardian_summary && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Guardian Summary
                  </Typography>
                  <Typography>{student.guardian_summary}</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Siblings Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <FamilyRestroomIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Siblings
              </Typography>
              {isAdmin && (
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setSiblingModalOpen(true)}
                >
                  Add Sibling
                </Button>
              )}
            </Box>

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
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveSibling(sibling.id)}
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
                        secondary={`${sibling.relationship}${sibling.age ? `, Age ${sibling.age}` : ""}`}
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
          </Paper>
        </Box>

        {/* Right Column - Linked People & Documents */}
        <Box sx={{ flex: 1 }}>
          {/* Linked Teachers */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <SchoolIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Linked Teachers
              </Typography>
              {isAdmin && (
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setLinkTeacherModalOpen(true)}
                >
                  Link Teacher
                </Button>
              )}
            </Box>

            {student.teachers.length > 0 ? (
              <List dense>
                {student.teachers.map((teacher) => (
                  <ListItem key={teacher.link_id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "info.main" }}>
                        {teacher.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={teacher.name}
                      secondary={teacher.email}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                No teachers linked
              </Typography>
            )}
          </Paper>

          {/* Linked Parents */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <FamilyRestroomIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Linked Parents
              </Typography>
              {isAdmin && (
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setLinkParentModalOpen(true)}
                >
                  Link Parent
                </Button>
              )}
            </Box>

            {student.parents.length > 0 ? (
              <List dense>
                {student.parents.map((parent) => (
                  <ListItem key={parent.link_id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "warning.main" }}>
                        {parent.name.charAt(0)}
                      </Avatar>
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
          </Paper>

          {/* Documents Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                <DescriptionIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Documents
              </Typography>
              {isAdmin && (
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Upload
                </Button>
              )}
            </Box>
            <DocumentList
              studentId={id!}
              canDelete={isAdmin}
              onUploadClick={() => setUploadModalOpen(true)}
            />
          </Paper>

          {/* Session Notes */}
          <SessionNotes 
            studentId={id!} 
            canAdd={isTeacher}
            canEdit={isTeacher}
          />

          {/* Assessments */}
          <AssessmentHistory
            studentId={id!}
            canAdd={isTeacher}
            canEdit={isTeacher}
          />
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

      {/* Link Teacher Modal */}
      <LinkTeacherModal
        open={linkTeacherModalOpen}
        onClose={() => setLinkTeacherModalOpen(false)}
        studentId={id!}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />

      {/* Link Parent Modal */}
      <LinkParentModal
        open={linkParentModalOpen}
        onClose={() => setLinkParentModalOpen(false)}
        studentId={id!}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        studentId={id!}
        studentName={student ? `${student.first_name} ${student.last_name}` : undefined}
      />
    </Box>
  );
}
