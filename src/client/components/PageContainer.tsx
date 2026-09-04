import { Container, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | false;
  sx?: SxProps<Theme>;
}

/**
 * Consistent max-width wrapper for all pages (ported from the legacy Vite app).
 * Eliminates double-padding issues by providing a single container.
 * The DashboardLayout already provides outer padding.
 */
export default function PageContainer({ children, maxWidth = "lg", sx }: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters
      sx={{
        py: { xs: 1, sm: 2 },
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
