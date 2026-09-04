"use client";

import ArticleIcon from "@mui/icons-material/Article";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ForumIcon from "@mui/icons-material/Forum";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import TodayIcon from "@mui/icons-material/Today";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { type UserRole, useAuth } from "@/client/auth";

type BottomNavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

const bottomNavItems: BottomNavItem[] = [
  // Admin
  { label: "Locations", to: "/locations", icon: <LocationOnIcon />, roles: ["administrator"] },
  { label: "Users", to: "/users", icon: <PeopleIcon />, roles: ["administrator"] },
  { label: "Students", to: "/students", icon: <SchoolIcon />, roles: ["administrator"] },
  { label: "Chat", to: "/chat", icon: <ForumIcon />, roles: ["administrator"] },

  // Teacher
  { label: "My Day", to: "/my-day", icon: <TodayIcon />, roles: ["teacher"] },
  { label: "Chat", to: "/chat", icon: <ForumIcon />, roles: ["teacher"] },

  // Parent
  { label: "My Children", to: "/my-students", icon: <ChildCareIcon />, roles: ["parent"] },
  { label: "Requests", to: "/parents/my-requests", icon: <ListAltIcon />, roles: ["parent"] },
];

// Common for all roles
const bulletinItem: BottomNavItem = {
  label: "Bulletin",
  to: "/bulletin",
  icon: <ArticleIcon />,
  roles: [],
};

export default function MobileBottomNav() {
  const { user, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user || user.role === "unassigned") return null;

  const visibleItems = [...bottomNavItems.filter((item) => hasRole(...item.roles)), bulletinItem];

  const currentIndex = visibleItems.findIndex(
    (item) => pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to)),
  );

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : false}
        onChange={(_, newValue: number) => {
          const target = visibleItems[newValue];
          if (target) void router.push(target.to);
        }}
        showLabels
        sx={{
          height: 56,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            py: 0.5,
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.65rem",
            },
          },
          "& .Mui-selected": {
            color: "primary.main",
          },
        }}
      >
        {visibleItems.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
