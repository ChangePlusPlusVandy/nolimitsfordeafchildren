import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArticleIcon from "@mui/icons-material/Article";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import TodayIcon from "@mui/icons-material/Today";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import SchoolIcon from "@mui/icons-material/School";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CampaignIcon from "@mui/icons-material/Campaign";
import BadgeIcon from "@mui/icons-material/Badge";
import PinDropIcon from "@mui/icons-material/PinDrop";
import ForumIcon from "@mui/icons-material/Forum";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import { Link, useLocation } from "react-router";
import { useAuth, type UserRole } from "../../../auth";

export const DRAWER_WIDTH = 240;

type NavItem = {
  text: string;
  to: string;
  icon: React.ReactNode;
  roles?: UserRole[]; // If undefined, shown to all roles
};

const navItems: NavItem[] = [
  // Admin-only items
  {
    text: "Site Map",
    to: "/locations",
    icon: <LocationOnIcon />,
    roles: ["administrator"],
  },
  {
    text: "Users",
    to: "/users",
    icon: <PeopleIcon />,
    roles: ["administrator"],
  },
  {
    text: "Students",
    to: "/students",
    icon: <SchoolIcon />,
    roles: ["administrator"],
  },
  {
    text: "Make-Ups",
    to: "/admin/makeup-requests",
    icon: <EventRepeatIcon />,
    roles: ["administrator"],
  },
  {
    text: "Schedule Changes",
    to: "/admin/schedule-change-requests",
    icon: <SwapHorizIcon />,
    roles: ["administrator"],
  },
  {
    text: "Sessions",
    to: "/admin/sessions",
    icon: <CalendarMonthIcon />,
    roles: ["administrator"],
  },
  {
    text: "Document Reviews",
    to: "/admin/document-reviews",
    icon: <FactCheckIcon />,
    roles: ["administrator"],
  },
  {
    text: "Parent ZIP Report",
    to: "/admin/parent-zip-report",
    icon: <PinDropIcon />,
    roles: ["administrator"],
  },
  {
    text: "Photo Gallery",
    to: "/admin/photo-gallery",
    icon: <PhotoLibraryIcon />,
    roles: ["administrator"],
  },
  {
    text: "Bulletin Moderation",
    to: "/admin/bulletin-moderation",
    icon: <CampaignIcon />,
    roles: ["administrator"],
  },

  // Teacher items
  {
    text: "My Day",
    to: "/my-day",
    icon: <TodayIcon />,
    roles: ["teacher"],
  },
  {
    text: "Make-Up Sessions",
    to: "/teachers/makeup-sessions",
    icon: <EventRepeatIcon />,
    roles: ["teacher"],
  },
  {
    text: "Schedule Requests",
    to: "/teachers/schedule-change-requests",
    icon: <SwapHorizIcon />,
    roles: ["teacher"],
  },
  {
    text: "Staff Chat",
    to: "/chat",
    icon: <ForumIcon />,
    roles: ["teacher", "administrator"],
  },

  // Parent items
  {
    text: "My Children",
    to: "/my-students",
    icon: <ChildCareIcon />,
    roles: ["parent"],
  },
  {
    text: "Schedule Change",
    to: "/parents/schedule-change",
    icon: <SwapHorizIcon />,
    roles: ["parent"],
  },
  {
    text: "My Requests",
    to: "/parents/my-requests",
    icon: <ListAltIcon />,
    roles: ["parent"],
  },
  {
    text: "Directory",
    to: "/parents/directory",
    icon: <BadgeIcon />,
    roles: ["parent"],
  },

  // Shared items (all roles)
  {
    text: "Bulletin",
    to: "/bulletin",
    icon: <ArticleIcon />,
  },
  {
    text: "Profile",
    to: "/my-profile",
    icon: <AccountCircleIcon />,
  },
];

interface SidebarProps {
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ isMobile = false, mobileOpen = false, onMobileClose }: SidebarProps) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    void logout();
  };

  const handleNavClick = () => {
    // Close mobile drawer on navigation
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) => {
    if (user?.role === "unassigned") {
      return item.to === "/my-profile";
    }

    if (!item.roles) return true; // Show to all if no roles specified
    return hasRole(...item.roles);
  });

  const drawerContent = (
    <Box
      sx={{ width: DRAWER_WIDTH, height: "100%", display: "flex", flexDirection: "column" }}
      role="presentation"
    >
      {/* User info */}
      {user && (
        <Box sx={{ px: 2, py: 2.5 }}>
          <Box
            sx={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "common.white",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {user.name}
          </Box>
          <Box
            sx={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {user.role === "unassigned" ? "Pending approval" : user.role}
          </Box>
        </Box>
      )}

      <Divider sx={{ mx: 1, mb: 1 }} />

      {/* Navigation items */}
      <List sx={{ padding: "0 8px", flexGrow: 1 }} component="nav" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <ListItem key={item.text} disablePadding sx={{ margin: "4px 0" }}>
              <ListItemButton
                component={Link}
                to={item.to}
                onClick={handleNavClick}
                sx={{
                  borderRadius: "8px",
                  color: "rgba(255,255,255,0.92)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                  ...(isActive && {
                    backgroundColor: "rgba(83, 171, 232, 0.22)",
                    borderLeft: "3px solid #53abe8",
                    "&:hover": {
                      backgroundColor: "rgba(83, 171, 232, 0.3)",
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: 40,
                    "& svg": { fontSize: "1.5rem" },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 700 : 500,
                    sx: { pt: 0.5, pb: 0.5 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout button at bottom */}
      <Box sx={{ padding: "0 8px", mb: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavClick();
                handleLogout();
              }}
              sx={{
                borderRadius: "8px",
                color: "rgba(255,255,255,0.92)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
              aria-label="Logout from application"
            >
              <ListItemIcon
                sx={{ color: "inherit", minWidth: 40, "& svg": { fontSize: "1.5rem" } }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.95rem" }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  // Mobile: temporary drawer that overlays content
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: "#0f2b40",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop: permanent drawer
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          backgroundColor: "#0f2b40",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
