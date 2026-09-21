"use client";

import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { useAuth } from "@/client/auth";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { TableSkeleton } from "@/client/components/skeletons";
import CreateStudentModal from "@/client/components/students/CreateStudentModal";
import { useServerTable } from "@/client/hooks/useServerTable";
import { listAllLocations } from "@/client/locations";
import { listStudents, type StudentFilters } from "@/client/students";

type ActiveFilter = "all" | "active" | "inactive";

interface StudentsListResult {
  items: Array<{
    id: string;
    site_id: string;
    initials: string;
    is_active: boolean;
  }>;
  total: number;
}

interface StudentsClientProps {
  initialData: StudentsListResult;
  initialQueryParams: StudentFilters;
}

function queryParamsMatch(a: StudentFilters, b: StudentFilters): boolean {
  return (
    a.page === b.page &&
    a.limit === b.limit &&
    (a.sort ?? "initials") === (b.sort ?? "initials") &&
    (a.order ?? "asc") === (b.order ?? "asc") &&
    (a.search ?? "") === (b.search ?? "") &&
    (a.site_id ?? "") === (b.site_id ?? "") &&
    a.is_active === b.is_active
  );
}

function StudentsIndexContent({ initialData, initialQueryParams }: StudentsClientProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const table = useServerTable({
    defaultLimit: 20,
    defaultOrder: "asc",
    defaultSort: "initials",
  });

  const locationFilter = table.getFilter("site_id");
  const activeFilter = (table.getFilter("active") || "active") as ActiveFilter;

  const queryParams: StudentFilters = {
    page: table.page,
    limit: table.limit,
    sort: (table.sort as StudentFilters["sort"]) ?? "initials",
    order: table.order ?? "asc",
    ...(table.debouncedSearch && { search: table.debouncedSearch }),
    ...(locationFilter && { site_id: locationFilter }),
    ...(activeFilter !== "all" && { is_active: activeFilter === "active" }),
  };

  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
    refetch,
  } = useQuery({
    queryKey: ["students", "list", queryParams],
    queryFn: () => listStudents(queryParams),
    initialData: queryParamsMatch(queryParams, initialQueryParams) ? initialData : undefined,
  });

  const { data: locations } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
  });

  const locationMap = new Map(locations?.map((loc) => [loc.id, loc.name]) ?? []);
  const students = studentsData?.items ?? [];

  if (studentsLoading && !studentsData) {
    return (
      <PageContainer>
        <PageHeader title="Students" breadcrumbs={[{ label: "Students" }]} />
        <TableSkeleton columns={4} rows={8} />
      </PageContainer>
    );
  }

  if (studentsError) {
    return (
      <PageContainer>
        <PageHeader title="Students" breadcrumbs={[{ label: "Students" }]} />
        <ErrorAlert
          message="Failed to load students. Please try again."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        breadcrumbs={[{ label: "Students" }]}
        actions={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Add Student
            </Button>
          ) : undefined
        }
      />

      <SectionCard sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Search"
            placeholder="Search by name or initials..."
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
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
      </SectionCard>

      <SectionCard noPadding>
        {students.length === 0 ? (
          <EmptyState
            icon={<SchoolIcon sx={{ fontSize: 48 }} />}
            title="No students found"
            description={isAdmin ? "Click 'Add Student' to create one." : undefined}
            actionLabel={isAdmin ? "Add Student" : undefined}
            onAction={isAdmin ? () => setCreateModalOpen(true) : undefined}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Initials</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/students/${student.id}`)}
                  >
                    <TableCell>
                      <Chip
                        label={student.initials}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
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
                          router.push(`/students/${student.id}`);
                        }}
                      >
                        View student
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
          </>
        )}
      </SectionCard>

      <CreateStudentModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </PageContainer>
  );
}

export default function StudentsClient(props: StudentsClientProps) {
  return (
    <Suspense fallback={<TableSkeleton columns={4} rows={8} />}>
      <StudentsIndexContent {...props} />
    </Suspense>
  );
}
