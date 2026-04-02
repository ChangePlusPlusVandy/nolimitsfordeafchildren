import {
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { Link as RouterLink } from "react-router";

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
 * Thin wrapper around MUI Breadcrumbs that integrates with React Router.
 * The last item is rendered as text (current page), earlier items as links.
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
            component={RouterLink}
            to={item.href}
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
