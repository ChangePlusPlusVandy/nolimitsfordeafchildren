"use client";

import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LogoutIcon from "@mui/icons-material/Logout";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/client/auth";

export default function PendingApprovalPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "unassigned") {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== "unassigned") {
    return null;
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
      <Card sx={{ width: "100%", maxWidth: 560 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5} sx={{ alignItems: "flex-start" }}>
            <HourglassTopIcon color="warning" sx={{ fontSize: 44 }} />
            <Typography variant="h5">Account pending approval</Typography>
            <Typography color="text.secondary">
              Hi {user?.name || "there"}, your account is created but not yet assigned a role. A No
              Limits administrator must approve and assign your access before you can use the app.
            </Typography>
            <Typography color="text.secondary">
              If you need immediate help, contact your site administrator and share this email:{" "}
              <strong>{user?.email}</strong>
            </Typography>

            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => {
                void logout();
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              Sign Out
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
