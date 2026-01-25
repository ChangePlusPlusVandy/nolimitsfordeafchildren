import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useParentHttpService } from "../services/ParentHttpService";

// Mock data for now
const mockStudents = [
  {
    id: "123",
    name: "Jane Doe",
    grade: "5th Grade",
    attendanceRate: "94%",
    status: "active",
  },
  {
    id: "456",
    name: "John Doe",
    grade: "8th Grade",
    attendanceRate: "89%",
    status: "active",
  },
  {
    id: "789",
    name: "Emily Doe",
    grade: "3rd Grade",
    attendanceRate: "97%",
    status: "active",
  },
];

export default function MyStudentsPage() {
  const navigate = useNavigate();
  const parentHttpService = useParentHttpService();

  const students = mockStudents;

  // Commented out for later when you connect backend:
  // const { mutate: _mutate } = useMutation({
  //   mutationKey: [parentHttpService.key, 'myStudents'],
  //   mutationFn: parentHttpService.mutations.myStudents,
  //   onSuccess: (data) => {
  //     console.log(data)
  //   },
  //   onError: (error) => {
  //     console.error(error)
  //   }
  // })

  const handleViewDetails = (studentId: string) => {
    navigate(`/parents/children/${studentId}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        My Students
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage your children's academic information
      </Typography>

      <Grid container spacing={3}>
        {students.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: "primary.main",
                        fontSize: 24,
                        fontWeight: 600,
                      }}
                    >
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {student.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.grade}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "success.lighter",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "success.light",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Attendance Rate
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "success.dark" }}
                    >
                      {student.attendanceRate}
                    </Typography>
                  </Box>

                  <Chip
                    label={
                      student.status.charAt(0).toUpperCase() +
                      student.status.slice(1)
                    }
                    color="success"
                    size="small"
                    sx={{ alignSelf: "flex-start" }}
                  />
                </Stack>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleViewDetails(student.id)}
                  sx={{ fontWeight: 600 }}
                >
                  View Details
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {students.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "grey.300",
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No students found
          </Typography>
        </Box>
      )}
    </Box>
  );
}
