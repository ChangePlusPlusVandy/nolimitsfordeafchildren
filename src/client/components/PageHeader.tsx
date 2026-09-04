"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Stack, type SxProps, type Theme, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import AppBreadcrumbs, { type BreadcrumbItem } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button. Pass `true` for navigate(-1), or a string for a specific route. */
  back?: boolean | string;
  /** Breadcrumb items rendered above the title. */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons (right side on desktop, stacked below on mobile). */
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Consistent page header with title, optional back button, breadcrumbs, and
 * action area (ported from the legacy Vite app; react-router navigate swapped
 * for next/navigation useRouter).
 */
export default function PageHeader({
  title,
  subtitle,
  back,
  breadcrumbs,
  actions,
  sx,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof back === "string") {
      router.push(back);
    } else {
      router.back();
    }
  };

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AppBreadcrumbs items={breadcrumbs} sx={{ mb: 1 }} />
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center" }}>
          {back && (
            <IconButton onClick={handleBack} size="small" aria-label="Go back" sx={{ mr: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "stretch", sm: "center" },
            }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
