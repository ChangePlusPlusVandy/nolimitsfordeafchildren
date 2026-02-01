// import { useQuery } from "@tanstack/react-query";
// import { useUserHttpService } from "../services/UserHttpService";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import { useState, useEffect } from "react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const dummydata = [
  {
    id: 1,
    type: "Admin",
    name: "Sarah Kim",
    location: "New York",
    status: "Active",
  },
  {
    id: 2,
    type: "Teacher",
    name: "Jason Lee",
    location: "Chicago",
    status: "Inactive",
  },
  {
    id: 3,
    type: "Teacher",
    name: "Maria Gonzalez",
    location: "Los Angeles",
    status: "Active",
  },
  {
    id: 4,
    type: "Student",
    name: "John Doe",
    location: "Houston",
    status: "Active",
  },
  {
    id: 5,
    type: "Student",
    name: "Alice Wong",
    location: "San Francisco",
    status: "Inactive",
  },
  {
    id: 6,
    type: "Teacher",
    name: "Bob Smith",
    location: "Seattle",
    status: "Active",
  },
];

export default function ManageUsersPage() {
  // const userHttpService = useUserHttpService();

  // const { data, isLoading, error } = useQuery({
  //   queryKey: [userHttpService.key, "index"],
  //   queryFn: userHttpService.queries.index,
  // });

  // if (isLoading) return <div>Loading users...</div>;
  // if (error) return <div>Failed to load users</div>;
  function CustomToolbar() {
    return (
      <GridToolbarContainer
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <div>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector
            slotProps={{ tooltip: { title: "Change density" } }}
          />
          <GridToolbarExport
            slotProps={{
              tooltip: { title: "Export data" },
            }}
          />
        </div>
        <div>
          <GridToolbarQuickFilter />
        </div>
      </GridToolbarContainer>
    );
  }

  const [rows, setRows] = useState(dummydata);
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    type: "",
    name: "",
    location: "",
    status: "Active",
  });

  const columns = [
    { field: "type", headerName: "Type", flex: 1 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params: any) => {
        const isActive = params.value === "Active";

        return (
          <Box
            sx={{
              color: isActive ? "#2e7d32" : "#d32f2f",
              textAlign: "left",
            }}
          >
            {params.value}
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: () => {
        return (
          <Box
            sx={{
              textAlign: "left",
            }}
          >
            Edit | Deactivate
          </Box>
        );
      },
    },
  ];

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setNewUser({ type: "", name: "", location: "", status: "" });
  };

  const addUser = () => {
    setRows([...rows, { id: rows.length + 1, ...newUser }]);
    handleClose();
  };

  useEffect(() => {}, []);

  return (
    <Box sx={{ mr: 6, ml: 6, mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Manage Users</h1>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpen}
        >
          Add User
        </Button>
      </Box>
      <br />
      <DataGrid
        rows={rows}
        columns={columns}
        slots={{
          toolbar: CustomToolbar,
        }}
        showToolbar
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              label="Role"
              value={newUser.type}
              onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}
            />
            <TextField
              label="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <TextField
              label="Location"
              value={newUser.location}
              onChange={(e) =>
                setNewUser({ ...newUser, location: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={addUser} variant="contained" sx={{ mr: 2 }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
