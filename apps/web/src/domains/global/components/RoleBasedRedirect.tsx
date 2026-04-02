import { Navigate } from "react-router";
import { Box, CircularProgress, Typography } from "@mui/material";
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary">
          Redirecting...
        </Typography>
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
    case "unassigned":
      return <Navigate to="/pending-approval" replace />;
    default:
      return <Navigate to="/my-profile" replace />;
  }
}
