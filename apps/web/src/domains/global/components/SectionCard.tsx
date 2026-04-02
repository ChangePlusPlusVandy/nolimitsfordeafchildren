import {
  Box,
  Divider,
  Paper,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

interface SectionCardProps {
  /** Optional card title. */
  title?: string;
  /** Optional icon rendered before the title. */
  icon?: ReactNode;
  /** Optional action area rendered in the top-right corner. */
  actions?: ReactNode;
  /** Card content. */
  children: ReactNode;
  /** If true, removes content padding (useful for tables). */
  noPadding?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * White card with consistent padding and an optional header (title + icon + actions).
 * Use for every distinct section on a page to achieve visual consistency.
 */
export default function SectionCard({
  title,
  icon,
  actions,
  children,
  noPadding = false,
  sx,
}: SectionCardProps) {
  const hasHeader = title || actions;

  return (
    <Paper sx={{ overflow: "hidden", ...sx }}>
      {hasHeader && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2.5, py: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {icon}
              {title && (
                <Typography variant="h6" component="h2">
                  {title}
                </Typography>
              )}
            </Stack>
            {actions && <Box>{actions}</Box>}
          </Stack>
          <Divider />
        </>
      )}
      <Box sx={noPadding ? undefined : { p: 2.5 }}>{children}</Box>
    </Paper>
  );
}
