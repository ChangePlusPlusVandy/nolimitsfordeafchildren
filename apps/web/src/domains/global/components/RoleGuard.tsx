import { Navigate } from "react-router";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth, type UserRole } from "../../../auth";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Protects routes by enforcing role-based access control.
 * Unauthorized users are redirected to their role-appropriate home page.
 */
export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, hasRole, isLoading } = useAuth();

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
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (!hasRole(...allowedRoles)) {
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
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
