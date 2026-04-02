import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import { DataTable, type DataTableColumn } from "../../global/components/DataTable";
import ErrorAlert from "../../global/components/ErrorAlert";
import {
  useUserHttpService,
  type UserRole,
  type ListUsersParams,
} from "../services/UserHttpService";
import InviteUserModal from "./InviteUserModal";

const columns: DataTableColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", hideBelow: "sm" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status", hideBelow: "sm" },
  { key: "actions", label: "", align: "right" },
];

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const userHttpService = useUserHttpService();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const queryParams: ListUsersParams = {
    page,
    limit: rowsPerPage,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [userHttpService.key, "index", queryParams],
    queryFn: () => userHttpService.queries.index(queryParams),
  });

  const getRoleLabel = (role: UserRole): string => {
    if (role === "parent") return "Parent/Guardian";
    if (role === "unassigned") return "Pending Approval";
    return role;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Manage Users"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite User
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
            sx={{ minWidth: { sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "");
                setPage(1);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="administrator">Administrator</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="parent">Parent/Guardian</MenuItem>
              <MenuItem value="unassigned">Pending Approval</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </SectionCard>

      {error && !isLoading && (
        <ErrorAlert message="Failed to load users." onRetry={() => refetch()} />
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
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        emptyIcon={<PeopleIcon sx={{ fontSize: 48 }} />}
      >
        {(data?.items ?? []).map((user) => (
          <TableRow
            key={user.id}
            hover
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/users/${user.id}`)}
          >
            <TableCell>{user.name}</TableCell>
            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
              {user.email}
            </TableCell>
            <TableCell>
              <Chip
                label={getRoleLabel(user.role)}
                size="small"
                variant="outlined"
                sx={{ textTransform: "capitalize" }}
              />
            </TableCell>
            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
              <Chip
                label={user.is_active ? "Active" : "Disabled"}
                color={user.is_active ? "success" : "default"}
                size="small"
                variant={user.is_active ? "filled" : "outlined"}
              />
            </TableCell>
            <TableCell align="right">
              <Button
                size="small"
                endIcon={<ChevronRightIcon fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/users/${user.id}`);
                }}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
      </Stack>

      <InviteUserModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </PageContainer>
  );
}
