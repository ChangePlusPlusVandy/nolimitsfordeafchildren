import { Navigate } from "react-router";
import { Box, CircularProgress } from "@mui/material";
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
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hasRole(...allowedRoles)) {
    // Redirect to role-appropriate home page
    switch (user?.role) {
      case "administrator":
        return <Navigate to="/users" replace />;
      case "teacher":
        return <Navigate to="/my-day" replace />;
      case "parent":
        return <Navigate to="/my-students" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
