import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonIcon from "@mui/icons-material/Person";
import { useStudentHttpService } from "../services/StudentHttpService";
import { useTeacherHttpService } from "../../teachers/services/TeacherHttpService";

export default function LinkTeacherModal() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const teacherHttpService = useTeacherHttpService();

  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Fetch student details to show current linked teachers
  const { data: student, isLoading: studentLoading, isError: studentError } = useQuery({
    queryKey: [studentHttpService.key, "show", studentId],
    queryFn: () => studentHttpService.queries.show(studentId!),
    enabled: !!studentId,
  });

  // Fetch all teachers for the dropdown
  const { data: teachersData, isLoading: teachersLoading, isError: teachersError } = useQuery({
    queryKey: [teacherHttpService.key, "index"],
    queryFn: () => teacherHttpService.queries.index(),
  });

  const teachers = Array.isArray(teachersData) 
    ? teachersData 
    : ((teachersData as any)?.items || []);

  // Filter out already linked teachers
  const linkedTeacherIds = student?.teachers?.map((t) => t.teacher_id) || [];
  const availableTeachers = teachers.filter(
    (t: any) => !linkedTeacherIds.includes(t.id)
  );

  // Link teacher mutation
  const linkMutation = useMutation({
    mutationFn: ({ studentId, teacher_id }: { studentId: string; teacher_id: string }) =>
      studentHttpService.mutations.linkTeacher({ studentId, teacher_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
      setSelectedTeacher(null);
    },
  });

  // Unlink teacher mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ studentId, teacherId }: { studentId: string; teacherId: string }) =>
      studentHttpService.mutations.unlinkTeacher({ studentId, teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
    },
  });

  const handleLinkTeacher = () => {
    if (selectedTeacher && studentId) {
      linkMutation.mutate({
        studentId,
        teacher_id: selectedTeacher.id,
      });
    }
  };

  const handleUnlinkTeacher = (teacherId: string) => {
    if (studentId && confirm("Are you sure you want to unlink this teacher?")) {
      unlinkMutation.mutate({ studentId, teacherId });
    }
  };

  const isLoading = studentLoading || teachersLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
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
        <Typography variant="h4" component="h1">
          Link Teacher
        </Typography>
      </Box>

      {(linkMutation.isError || unlinkMutation.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {((linkMutation.error || unlinkMutation.error) as Error)?.message || 
            "An error occurred. Please try again."}
        </Alert>
      )}

      {(studentError || teachersError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load data. Please refresh the page.
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Add Teacher Section */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            <LinkIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Add Teacher
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search and select a teacher to link to this student.
          </Typography>

          <Autocomplete
            value={selectedTeacher}
            onChange={(_, newValue) => setSelectedTeacher(newValue)}
            options={availableTeachers}
            getOptionLabel={(option: any) => option.name || option.user?.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={teachersLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Teachers"
                placeholder="Type to search..."
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "info.main" }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {option.name || option.user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email || option.user?.email}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={linkMutation.isPending ? <CircularProgress size={20} /> : <LinkIcon />}
            onClick={handleLinkTeacher}
            disabled={!selectedTeacher || linkMutation.isPending}
            fullWidth
          >
            Link Teacher
          </Button>
        </Paper>

        {/* Currently Linked Teachers */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Currently Linked Teachers
          </Typography>

          {student?.teachers && student.teachers.length > 0 ? (
            <List>
              {student.teachers.map((teacher) => (
                <ListItem
                  key={teacher.link_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleUnlinkTeacher(teacher.teacher_id)}
                      disabled={unlinkMutation.isPending}
                    >
                      <LinkOffIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "info.main" }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={teacher.name}
                    secondary={
                      <>
                        {teacher.email}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Linked: {new Date(teacher.assigned_at).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No teachers currently linked to this student.
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
