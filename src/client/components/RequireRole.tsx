"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { type UserRole, useAuth } from "@/client/auth";

/**
 * Renders children only when the current user has one of the allowed roles;
 * others are redirected away once auth has loaded.
 */
export default function RequireRole({
  children,
  roles,
  redirectTo = "/",
}: {
  children: ReactNode;
  roles: UserRole[];
  redirectTo?: string;
}) {
  const { hasRole, isLoading } = useAuth();
  const router = useRouter();
  const isAllowed = hasRole(...roles);

  useEffect(() => {
    if (!isLoading && !isAllowed) {
      router.replace(redirectTo);
    }
  }, [isAllowed, isLoading, redirectTo, router]);

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

  if (!isAllowed) {
    return null;
  }

  return children;
}
