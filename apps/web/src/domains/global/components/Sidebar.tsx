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
  Avatar,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArticleIcon from "@mui/icons-material/Article";
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
import Diversity3Icon from "@mui/icons-material/Diversity3";
import { Link, useLocation } from "react-router";
import { useAuth, type UserRole } from "../../../auth";
import nolimitsLogo from "../../../assets/nolimitslogo.png";

export const DRAWER_WIDTH = 256;

type NavItem = {
  text: string;
  to: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  section: string;
};

const navItems: NavItem[] = [
  // ---- Admin: Management ----
  {
    text: "Site Map",
    to: "/locations",
    icon: <LocationOnIcon />,
    roles: ["administrator"],
    section: "Management",
  },
  {
    text: "Users",
    to: "/users",
    icon: <PeopleIcon />,
    roles: ["administrator"],
    section: "Management",
  },
  {
    text: "Students",
    to: "/students",
    icon: <SchoolIcon />,
    roles: ["administrator"],
    section: "Management",
  },
  {
    text: "Sessions",
    to: "/admin/sessions",
    icon: <CalendarMonthIcon />,
    roles: ["administrator"],
    section: "Management",
  },

  // ---- Admin: Requests ----
  {
    text: "Make-Ups",
    to: "/admin/makeup-requests",
    icon: <EventRepeatIcon />,
    roles: ["administrator"],
    section: "Requests",
  },
  {
    text: "Schedule Changes",
    to: "/admin/schedule-change-requests",
    icon: <SwapHorizIcon />,
    roles: ["administrator"],
    section: "Requests",
  },
  {
    text: "Document Reviews",
    to: "/admin/document-reviews",
    icon: <FactCheckIcon />,
    roles: ["administrator"],
    section: "Requests",
  },
  {
    text: "Bulletin Moderation",
    to: "/admin/bulletin-moderation",
    icon: <CampaignIcon />,
    roles: ["administrator"],
    section: "Requests",
  },

  // ---- Admin: Reports ----
  {
    text: "Parent ZIP Report",
    to: "/admin/parent-zip-report",
    icon: <PinDropIcon />,
    roles: ["administrator"],
    section: "Reports",
  },
  {
    text: "Sibling Participation",
    to: "/admin/sibling-participation-report",
    icon: <Diversity3Icon />,
    roles: ["administrator"],
    section: "Reports",
  },
  {
    text: "Photo Gallery",
    to: "/admin/photo-gallery",
    icon: <PhotoLibraryIcon />,
    roles: ["administrator"],
    section: "Reports",
  },

  // ---- Teacher ----
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
    section: "Teacher",
  },
  {
    text: "Schedule Requests",
    to: "/teachers/schedule-change-requests",
    icon: <SwapHorizIcon />,
    roles: ["teacher"],
    section: "Teacher",
  },

  // ---- Shared: Staff ----
  {
    text: "Staff Chat",
    to: "/chat",
    icon: <ForumIcon />,
    roles: ["teacher", "administrator"],
    section: "Staff",
  },

  // ---- Parent ----
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
    section: "Parent",
  },
  {
    text: "My Requests",
    to: "/parents/my-requests",
    icon: <ListAltIcon />,
    roles: ["parent"],
    section: "Parent",
  },
  {
    text: "Directory",
    to: "/parents/directory",
    icon: <BadgeIcon />,
    roles: ["parent"],
    section: "Parent",
  },

  // ---- General (all roles) ----
  {
    text: "Bulletin",
    to: "/bulletin",
    icon: <ArticleIcon />,
    section: "General",
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: "temporary" | "persistent";
}

export const Sidebar = ({ open, onClose, variant = "temporary" }: SidebarProps) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    void logout();
  };

  const handleNavClick = () => {
    if (variant === "temporary") onClose();
  };

  const visibleItems = navItems.filter((item) => {
    if (user?.role === "unassigned") {
      return false;
    }
    if (!item.roles) return true;
    return hasRole(...item.roles);
  });

  return (
    <Drawer
      variant={variant}
      anchor="left"
      open={open}
      onClose={onClose}
      {...(variant === "temporary" && { ModalProps: { keepMounted: true } })}
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "#fafbfc",
        },
      }}
    >
      <Box
        sx={{ width: DRAWER_WIDTH, height: "100%", display: "flex", flexDirection: "column" }}
        role="presentation"
      >
        {/* Branding */}
        <Box
          component={Link}
          to="/"
          onClick={handleNavClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 2,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Box
            component="img"
            src={nolimitsLogo}
            alt="No Limits logo"
            sx={{ height: 36, width: "auto" }}
          />
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontSize: "0.8rem", lineHeight: 1.2 }}
          >
            No Limits for
            <br />
            Deaf Children
          </Typography>
        </Box>
        <Divider />

        {/* Navigation items */}
        <List
          sx={{ flexGrow: 1, pt: 0.5, overflow: "auto" }}
          component="nav"
          aria-label="Main navigation"
        >
          {visibleItems.map((item, index) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));

            const prevSection = index > 0 ? visibleItems[index - 1]?.section : null;
            const showSection = item.section !== prevSection;

            return (
              <Box key={item.text}>
                {showSection && (
                  <>
                    {index > 0 && <Divider sx={{ my: 0.5, mx: 2 }} />}
                    <Typography
                      variant="caption"
                      sx={{
                        px: 2.5,
                        pt: index === 0 ? 1 : 1.5,
                        pb: 0.5,
                        display: "block",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      {item.section}
                    </Typography>
                  </>
                )}
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.to}
                    selected={isActive}
                    onClick={handleNavClick}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: "0.875rem" }}
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            );
          })}
        </List>

        {/* Bottom section: user info + logout */}
        <Divider />
        {user && (
          <Box
            component={Link}
            to="/my-profile"
            onClick={handleNavClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "background-color 0.15s",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            aria-label="Go to my profile"
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontSize: "0.85rem" }}>
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ textTransform: "capitalize" }}
              >
                {user.role === "unassigned" ? "Pending approval" : user.role}
              </Typography>
            </Box>
          </Box>
        )}
        <List sx={{ px: 1, pt: 0, pb: 1 }} disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavClick();
                handleLogout();
              }}
              aria-label="Logout from application"
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.875rem" }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
