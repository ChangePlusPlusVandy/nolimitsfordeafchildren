import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SchoolIcon from "@mui/icons-material/School";
import { TableSkeleton } from "../../global/components/skeletons";
import { useServerTable } from "../../global/hooks/useServerTable";

import { useStudentHttpService, type StudentFilters } from "../services/StudentHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useAuth } from "../../../auth";
import CreateStudentModal from "./CreateStudentModal";

type ActiveFilter = "all" | "active" | "inactive";

export default function StudentsIndexPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const studentHttpService = useStudentHttpService();
  const locationHttpService = useLocationHttpService();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const table = useServerTable({
    defaultLimit: 20,
    defaultOrder: "asc",
    defaultSort: "initials",
  });

  const locationFilter = table.getFilter("site_id");
  const activeFilter = (table.getFilter("active") || "active") as ActiveFilter;

  // Build query params
  const queryParams: StudentFilters = {
    page: table.page,
    limit: table.limit,
    sort: (table.sort as StudentFilters["sort"]) ?? "initials",
    order: table.order ?? "asc",
    ...(table.debouncedSearch && { search: table.debouncedSearch }),
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
    queryKey: [locationHttpService.key, "index", "students-filter"],
    queryFn: locationHttpService.queries.index,
  });

  // Create a map of location IDs to names for display
  const locationMap = new Map(locations?.map((loc) => [loc.id, loc.name]) ?? []);

  const students = studentsData?.items ?? [];

  if (studentsLoading) {
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
        </Box>
        <TableSkeleton columns={5} rows={8} />
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
            onClick={() => setCreateModalOpen(true)}
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
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
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
              onChange={(e) => table.setFilter("site_id", e.target.value)}
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
              onChange={(e) => table.setFilter("active", e.target.value as ActiveFilter)}
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
                    <Chip label={student.initials} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {student.first_name && student.last_name
                        ? `${student.first_name} ${student.last_name}`
                        : "-"}
                    </TableCell>
                  )}
                  <TableCell>{locationMap.get(student.site_id) ?? "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={student.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={student.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="inherit"
                      endIcon={<ChevronRightIcon fontSize="small" />}
                      sx={{ textTransform: "none" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${student.id}`);
                      }}
                    >
                      View student
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={studentsData?.total ?? 0}
          rowsPerPage={table.limit}
          page={Math.max(table.page - 1, 0)}
          onPageChange={(_e, nextPage) => table.setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
        />
      </Paper>

      {/* Create Student Modal */}
      <CreateStudentModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </Box>
  );
}
