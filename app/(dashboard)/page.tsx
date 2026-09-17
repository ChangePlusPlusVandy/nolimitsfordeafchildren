"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/client/auth";

/**
 * Redirects authenticated users to their role-appropriate landing page
 * (ported from the legacy RoleBasedRedirect). Used at the root route (/).
 */
export default function RoleBasedRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    switch (user.role) {
      case "administrator":
        router.replace("/users");
        break;
      case "teacher":
        router.replace("/my-day");
        break;
      case "parent":
        router.replace("/my-students");
        break;
      case "unassigned":
        router.replace("/pending-approval");
        break;
      default:
        router.replace("/my-profile");
        break;
    }
  }, [isLoading, user, router]);

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
