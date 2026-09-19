"use client";

import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TableCell,
  TableRow,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/client/components/DataTable";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { listAllLocations } from "@/client/locations";
import {
  AGE_GROUP_LABELS,
  type AgeGroupSpecialty,
  type ListTeachersQuery,
  listTeachers,
} from "@/client/teachers";

const columns: DataTableColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", hideBelow: "sm" },
  { key: "specialty", label: "Specialty", hideBelow: "md" },
  { key: "site", label: "Primary Site", hideBelow: "md" },
  { key: "status", label: "Status", hideBelow: "sm" },
  { key: "actions", label: "", align: "right" },
];

interface TeachersListResult {
  items: Array<{
    id: string;
    age_group_specialty: string | null;
    user: { name: string; email: string; is_active: boolean };
    primarySite?: { name: string } | null;
  }>;
  total: number;
}

interface LocationOption {
  id: string;
  name: string;
}

interface TeachersClientProps {
  initialTeachers: TeachersListResult | null;
  initialLocations: LocationOption[] | null;
  initialQueryParams: ListTeachersQuery;
}

function queryParamsMatch(a: ListTeachersQuery, b: ListTeachersQuery): boolean {
  return (
    a.page === b.page &&
    a.limit === b.limit &&
    (a.sort ?? "name") === (b.sort ?? "name") &&
    (a.order ?? "asc") === (b.order ?? "asc") &&
    (a.search ?? "") === (b.search ?? "") &&
    (a.site_id ?? "") === (b.site_id ?? "") &&
    a.is_active === b.is_active
  );
}

export default function TeachersClient({
  initialTeachers,
  initialLocations,
  initialQueryParams,
}: TeachersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("active");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const queryParams: ListTeachersQuery = {
    page,
    limit: rowsPerPage,
    sort: "name",
    order: "asc",
    ...(search && { search }),
    ...(siteFilter && { site_id: siteFilter }),
    ...(activeFilter !== "all" && { is_active: activeFilter === "active" }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teachers", "list", queryParams],
    queryFn: () => listTeachers(queryParams),
    initialData:
      initialTeachers && queryParamsMatch(queryParams, initialQueryParams)
        ? initialTeachers
        : undefined,
  });

  const { data: locations = initialLocations ?? [] } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
    initialData: initialLocations ?? undefined,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Teachers"
        breadcrumbs={[{ label: "Teachers" }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/teachers/new")}
          >
            Add Teacher
          </Button>
        }
      />

      <Stack spacing={3}>
        <SectionCard>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              size="small"
              sx={{ minWidth: { sm: 280 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Primary Site</InputLabel>
              <Select
                value={siteFilter}
                label="Primary Site"
                onChange={(e) => {
                  setSiteFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Sites</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                label="Status"
                onChange={(e) => {
                  setActiveFilter(e.target.value as "all" | "active" | "inactive");
                  setPage(1);
                }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SectionCard>

        {error && !isLoading && (
          <ErrorAlert message="Failed to load teachers." onRetry={() => refetch()} />
        )}

        <DataTable
          columns={columns}
          loading={isLoading}
          error={undefined}
          onRetry={() => refetch()}
          total={data?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(1);
          }}
          emptyTitle="No teachers found"
          emptyDescription="Try adjusting your search or filters, or add a new teacher profile."
          emptyIcon={<PeopleIcon sx={{ fontSize: 48 }} />}
        >
          {(data?.items ?? []).map((teacher) => (
            <TableRow
              key={teacher.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => router.push(`/teachers/${teacher.id}`)}
            >
              <TableCell>{teacher.user.name}</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                {teacher.user.email}
              </TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                {teacher.age_group_specialty ? (
                  <Chip
                    label={AGE_GROUP_LABELS[teacher.age_group_specialty as AgeGroupSpecialty]}
                    size="small"
                    variant="outlined"
                  />
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                {teacher.primarySite?.name ?? "—"}
              </TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <Chip
                  label={teacher.user.is_active ? "Active" : "Inactive"}
                  color={teacher.user.is_active ? "success" : "default"}
                  size="small"
                  variant={teacher.user.is_active ? "filled" : "outlined"}
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  endIcon={<ChevronRightIcon fontSize="small" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/teachers/${teacher.id}`);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </Stack>
    </PageContainer>
  );
}
