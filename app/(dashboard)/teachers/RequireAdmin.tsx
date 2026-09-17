"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/client/auth";

/**
 * Renders children only for administrators; others are redirected away.
 */
export default function RequireAdmin({
  children,
  redirectTo = "/my-day",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace(redirectTo);
    }
  }, [isAdmin, isLoading, redirectTo, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "40vh",
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return children;
}
