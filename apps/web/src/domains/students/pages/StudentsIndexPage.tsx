import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SchoolIcon from "@mui/icons-material/School";

import { useStudentHttpService, type StudentFilters } from "../services/StudentHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useAuth } from "../../../auth";

type ActiveFilter = "all" | "active" | "inactive";

export default function StudentsIndexPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const studentHttpService = useStudentHttpService();
  const locationHttpService = useLocationHttpService();

  // Filter state
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");

  // Build query params
  const queryParams: StudentFilters = {
    limit: 50,
    ...(search && { search }),
    ...(locationFilter && { site_id: locationFilter }),
    ...(activeFilter !== "all" && { is_active: activeFilter === "active" }),
  };

  // Fetch students
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: [studentHttpService.key, "index", queryParams],
    queryFn: () => studentHttpService.queries.index(queryParams),
  });

  // Fetch locations for filter dropdown
  const { data: locations } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: locationHttpService.queries.index,
  });

  // Create a map of location IDs to names for display
  const locationMap = new Map(locations?.map((loc) => [loc.id, loc.name]) ?? []);

  if (studentsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (studentsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load students. Please try again.
      </Alert>
    );
  }

  const students = studentsData?.items ?? [];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Students
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/students/new")}
          >
            Add Student
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Search"
            placeholder="Search by name or initials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={locationFilter}
              label="Location"
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <MenuItem value="">All Locations</MenuItem>
              {locations?.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={activeFilter}
              label="Status"
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Students Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Initials</TableCell>
                {isAdmin && <TableCell>Name</TableCell>}
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                    <Box sx={{ py: 4 }}>
                      <SchoolIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                      <Typography color="text.secondary">
                        No students found.
                        {isAdmin && " Click 'Add Student' to create one."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell>
                      <Chip
                        label={student.initials}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {student.first_name && student.last_name
                          ? `${student.first_name} ${student.last_name}`
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {locationMap.get(student.site_id) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={student.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/students/${student.id}`);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {students.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {students.length} student{students.length !== 1 ? "s" : ""}
              {studentsData?.nextCursor && " (more available)"}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
