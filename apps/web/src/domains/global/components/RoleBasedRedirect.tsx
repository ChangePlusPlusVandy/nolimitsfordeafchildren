import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../../auth";

/**
 * Redirects authenticated users to their role-appropriate landing page.
 * Used at the root route (/) to provide a personalized entry point.
 */
export default function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  switch (user?.role) {
    case "administrator":
      return <Navigate to="/users" replace />;
    case "teacher":
      return <Navigate to="/my-day" replace />;
    case "parent":
      return <Navigate to="/my-students" replace />;
    default:
      // Fallback for unknown role
      return <Navigate to="/my-profile" replace />;
  }
}
