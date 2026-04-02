import {
  Box,
  IconButton,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router";
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
 * Consistent page header with title, optional back button, breadcrumbs, and action area.
 * Stacks responsively on mobile.
 */
export default function PageHeader({
  title,
  subtitle,
  back,
  breadcrumbs,
  actions,
  sx,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === "string") {
      navigate(back);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AppBreadcrumbs items={breadcrumbs} sx={{ mb: 1 }} />
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          {back && (
            <IconButton
              onClick={handleBack}
              size="small"
              aria-label="Go back"
              sx={{ mr: 0.5 }}
            >
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
