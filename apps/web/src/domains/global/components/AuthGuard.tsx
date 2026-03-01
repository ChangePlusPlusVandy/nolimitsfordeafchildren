import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect } from "react";
import { useAuth } from "../../../auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { authEnabled, isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!authEnabled) return;
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [authEnabled, isAuthenticated, isLoading, login]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
          bgcolor: "#f5f5f5",
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
          bgcolor: "#f5f5f5",
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Redirecting to login...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
