import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
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
  Divider,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonIcon from "@mui/icons-material/Person";
import { useStudentHttpService } from "../services/StudentHttpService";
import { useTeacherHttpService } from "../../teachers/services/TeacherHttpService";
import { useToast } from "../../global/components/ToastProvider";

interface LinkTeacherModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

export default function LinkTeacherModal({ open, onClose, studentId, studentName }: LinkTeacherModalProps) {
  const queryClient = useQueryClient();
  const studentHttpService = useStudentHttpService();
  const teacherHttpService = useTeacherHttpService();
  const toast = useToast();

  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Fetch student details to show current linked teachers
  const { data: student, isLoading: studentLoading, isError: studentError } = useQuery({
    queryKey: [studentHttpService.key, "show", studentId],
    queryFn: () => studentHttpService.queries.show(studentId),
    enabled: open && !!studentId,
  });

  // Fetch all teachers for the dropdown
  const { data: teachersData, isLoading: teachersLoading, isError: teachersError } = useQuery({
    queryKey: [teacherHttpService.key, "index"],
    queryFn: () => teacherHttpService.queries.index(),
    enabled: open,
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
      toast.success("Teacher linked successfully");
      setSelectedTeacher(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to link teacher");
    },
  });

  // Unlink teacher mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ studentId, teacherId }: { studentId: string; teacherId: string }) =>
      studentHttpService.mutations.unlinkTeacher({ studentId, teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [studentHttpService.key, "show", studentId] });
      toast.success("Teacher unlinked successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to unlink teacher");
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

  const handleClose = () => {
    setSelectedTeacher(null);
    onClose();
  };

  const isLoading = studentLoading || teachersLoading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Link Teacher
        {studentName && (
          <Typography variant="body2" color="text.secondary">
            for {studentName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {(studentError || teachersError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load data. Please try again.
          </Alert>
        )}

        {/* Add Teacher Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Search and select a teacher to link
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
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
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "info.main" }}>
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
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={linkMutation.isPending ? <CircularProgress size={16} /> : <LinkIcon />}
              onClick={handleLinkTeacher}
              disabled={!selectedTeacher || linkMutation.isPending}
            >
              Link
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Currently Linked Teachers */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Currently Linked Teachers ({student?.teachers?.length || 0})
          </Typography>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : student?.teachers && student.teachers.length > 0 ? (
            <List dense sx={{ maxHeight: 240, overflow: "auto" }}>
              {student.teachers.map((teacher) => (
                <ListItem
                  key={teacher.link_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      size="small"
                      onClick={() => handleUnlinkTeacher(teacher.teacher_id)}
                      disabled={unlinkMutation.isPending}
                    >
                      <LinkOffIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "info.main" }}>
                      <PersonIcon fontSize="small" />
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
              No teachers currently linked.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
