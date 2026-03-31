import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LogoutIcon from "@mui/icons-material/Logout";
import { Navigate } from "react-router";
import { useAuth } from "../../../auth";

export default function PendingApprovalPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "unassigned") {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 5,
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 560, borderRadius: 4, boxShadow: 8 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5} alignItems="flex-start">
            <HourglassTopIcon color="warning" sx={{ fontSize: 44 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Account pending approval
            </Typography>
            <Typography color="text.secondary">
              Hi {user?.name || "there"}, your account is created but not yet assigned a role. A No
              Limits administrator must approve and assign your access before you can use the app.
            </Typography>
            <Typography color="text.secondary">
              If you need immediate help, contact your site administrator and share this email: {" "}
              <strong>{user?.email}</strong>
            </Typography>

            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => {
                void logout();
              }}
            >
              Sign Out
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
