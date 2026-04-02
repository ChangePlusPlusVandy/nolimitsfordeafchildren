import { useState, useEffect, useRef } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Outlet } from "react-router";
import { Sidebar, DRAWER_WIDTH } from "../components/Sidebar";

const TRANSITION = "margin 0.2s ease, width 0.2s ease";
const STORAGE_KEY = "sidebar-open";

function readSidebarOpen(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true"; // default open
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

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(() =>
    isMobile ? false : readSidebarOpen(),
  );
  const prevMobile = useRef(isMobile);

  // Only react to breakpoint *transitions*, not every render
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
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
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minHeight: "100vh",
          overflow: "auto",
          bgcolor: "background.default",
          transition: TRANSITION,
          ...(desktopOpen && {
            marginLeft: `${DRAWER_WIDTH}px`,
          }),
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
