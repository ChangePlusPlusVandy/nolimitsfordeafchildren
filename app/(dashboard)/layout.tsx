"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import MobileBottomNav from "@/client/components/MobileBottomNav";
import { DRAWER_WIDTH, Sidebar } from "@/client/components/Sidebar";

const TRANSITION = "margin 0.2s ease, width 0.2s ease";
const STORAGE_KEY = "sidebar-open";

/** Map route prefixes to human-readable page titles. */
const routeTitles: Record<string, string> = {
  "/locations": "Site Map",
  "/users": "Users",
  "/students": "Students",
  "/my-day": "My Day",
  "/my-students": "My Children",
  "/my-profile": "My Profile",
  "/bulletin": "Bulletin Board",
  "/chat": "Staff Chat",
  "/admin/makeup-requests": "Make-Up Requests",
  "/admin/schedule-change-requests": "Schedule Changes",
  "/admin/sessions": "Sessions",
  "/admin/document-reviews": "Document Reviews",
  "/admin/parent-zip-report": "Parent ZIP Report",
  "/admin/sibling-participation-report": "Sibling Participation",
  "/admin/photo-gallery": "Photo Gallery",
  "/admin/bulletin-moderation": "Bulletin Moderation",
  "/teachers/makeup-sessions": "Make-Up Sessions",
  "/teachers/schedule-change-requests": "Schedule Requests",
  "/parents/schedule-change": "Schedule Change",
  "/parents/my-requests": "My Requests",
  "/parents/directory": "Directory",
};

function resolveTitle(pathname: string): string {
  // Try exact match first, then longest prefix
  if (routeTitles[pathname]) return routeTitles[pathname];
  const match = Object.keys(routeTitles)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeTitles[match] : "";
}

function readSidebarOpen(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

function writeSidebarOpen(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
}

/**
 * Dashboard shell — app bar + sidebar drawer + mobile bottom nav.
 * Ported from the legacy DashboardLayout (react-router → next/navigation).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();
  const contentId = useId();
  const [drawerOpen, setDrawerOpen] = useState(() => (isMobile ? false : readSidebarOpen()));
  const prevMobile = useRef(isMobile);

  useEffect(() => {
    if (prevMobile.current === isMobile) return;
    prevMobile.current = isMobile;

    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(readSidebarOpen());
    }
  }, [isMobile]);

  const handleToggle = () => {
    setDrawerOpen((prev) => {
      const next = !prev;
      if (!isMobile) writeSidebarOpen(next);
      return next;
    });
  };

  const desktopOpen = !isMobile && drawerOpen;
  const pageTitle = resolveTitle(pathname);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Skip to content link for keyboard accessibility */}
      <Box
        component="a"
        href={`#${contentId}`}
        sx={{
          position: "absolute",
          top: -40,
          left: 0,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          px: 2,
          py: 1,
          zIndex: 9999,
          "&:focus": {
            top: 0,
          },
        }}
      >
        Skip to content
      </Box>

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: TRANSITION,
          ...(desktopOpen && {
            marginLeft: `${DRAWER_WIDTH}px`,
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            edge="start"
            onClick={handleToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          {pageTitle && (
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              {pageTitle}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Sidebar
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          if (!isMobile) writeSidebarOpen(false);
        }}
        variant={isMobile ? "temporary" : "persistent"}
      />

      <Box
        component="main"
        id={contentId}
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minHeight: "100vh",
          bgcolor: "background.default",
          transition: TRANSITION,
          ...(desktopOpen && {
            marginLeft: `${DRAWER_WIDTH}px`,
          }),
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Toolbar />
        {children}
        {/* Spacer for mobile bottom nav */}
        {isMobile && <Box sx={{ height: 56 }} />}
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </Box>
  );
}
