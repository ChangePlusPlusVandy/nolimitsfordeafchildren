import InboxIcon from "@mui/icons-material/InboxOutlined";
import { Box, Button, type SxProps, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icon to display. Defaults to InboxOutlined. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Label for the call-to-action button. */
  actionLabel?: string;
  /** Called when the CTA button is clicked. */
  onAction?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Centered empty state with icon, message, and optional CTA (ported from the
 * legacy Vite app). Use inside SectionCard or standalone whenever a list/table
 * has zero items.
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
        textAlign: "center",
        ...sx,
      }}
    >
      <Box sx={{ color: "text.disabled", mb: 1.5 }}>
        {icon ?? <InboxIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, mb: actionLabel ? 2.5 : 0 }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
