import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
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
  roles?: UserRole[];
  section?: string;
};

const navItems: NavItem[] = [
  // Admin-only items
  {
    text: "Site Map",
    to: "/locations",
    icon: <LocationOnIcon />,
    roles: ["administrator"],
    section: "Admin",
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
    section: "Teacher",
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
    section: "Parent",
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
    section: "General",
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
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const visibleItems = navItems.filter((item) => {
    if (user?.role === "unassigned") {
      return item.to === "/my-profile";
    }
    if (!item.roles) return true;
    return hasRole(...item.roles);
  });

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: "100%", display: "flex", flexDirection: "column" }} role="presentation">
      {/* User info */}
      {user && (
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="subtitle2" noWrap>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role === "unassigned" ? "Pending approval" : user.role}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Navigation items */}
      <List sx={{ flexGrow: 1, px: 1 }} component="nav" aria-label="Main navigation">
        {visibleItems.map((item, index) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));

          // Show section header if this item starts a new section
          const showSection = item.section && (index === 0 || visibleItems[index - 1]?.section !== item.section);

          return (
            <Box key={item.text}>
              {showSection && (
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ px: 2, pt: index === 0 ? 1 : 2, pb: 0.5, display: "block" }}
                >
                  {item.section}
                </Typography>
              )}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.to}
                  selected={isActive}
                  onClick={handleNavClick}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            </Box>
          );
        })}
      </List>

      {/* Logout button at bottom */}
      <Divider />
      <List sx={{ px: 1 }} disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              handleNavClick();
              handleLogout();
            }}
            aria-label="Logout from application"
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

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
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
