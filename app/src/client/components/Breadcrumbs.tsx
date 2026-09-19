"use client";

import {
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  type SxProps,
  type Theme,
  Typography,
} from "@mui/material";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { forwardRef } from "react";

export interface BreadcrumbItem {
  label: string;
  /** If omitted, the item is rendered as plain text (current page). */
  href?: string;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  sx?: SxProps<Theme>;
}

/**
 * Adapter that lets MUI's `component` prop render next/link links
 * (Next.js integration, replacing react-router's Link).
 */
export const NextLinkBehavior = forwardRef<
  HTMLAnchorElement,
  Omit<NextLinkProps, "href"> & { href: string }
>(function NextLinkBehavior(props, ref) {
  return <NextLink ref={ref} {...props} />;
});

/**
 * Thin wrapper around MUI Breadcrumbs that integrates with Next.js routing
 * (ported from the legacy Vite app's react-router version). The last item is
 * rendered as text (current page), earlier items as links.
 */
export default function AppBreadcrumbs({ items, sx }: AppBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <MuiBreadcrumbs
      aria-label="Breadcrumb navigation"
      separator="›"
      sx={{
        "& .MuiBreadcrumbs-separator": {
          mx: 0.5,
          color: "text.disabled",
        },
        ...sx,
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Typography
              key={item.label}
              variant="body2"
              color={isLast ? "text.primary" : "text.secondary"}
              sx={{ fontWeight: isLast ? 500 : 400 }}
            >
              {item.label}
            </Typography>
          );
        }

        return (
          <MuiLink
            key={item.label}
            component={NextLinkBehavior}
            href={item.href}
            variant="body2"
            color="text.secondary"
            underline="hover"
          >
            {item.label}
          </MuiLink>
        );
      })}
    </MuiBreadcrumbs>
  );
}
