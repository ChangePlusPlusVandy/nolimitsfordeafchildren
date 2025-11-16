import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArticleIcon from "@mui/icons-material/Article";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth0 } from "@auth0/auth0-react";
import { Link, useLocation } from "react-router-dom";
import nolimitsLogo from "../../../assets/nolimitslogo.png";

const navItems = [
  {
    text: "Site Map",
    to: "/locations",
    icon: <LocationOnIcon />,
    adminOnly: true,
  },
  { text: "User List", to: "/users", icon: <PeopleIcon />, adminOnly: true },
  {
    text: "Bulletin",
    to: "/bulletin",
    icon: <ArticleIcon />,
    adminOnly: false,
  },
  {
    text: "Profile",
    to: "/my-profile",
    icon: <AccountCircleIcon />,
    adminOnly: false,
  },
];

// adjust based on role set up later
const checkIsAdmin = (user: any) => {
  return user?.role === "Administrator";
};

export const Sidebar = () => {
  const { user, logout } = useAuth0();
  const location = useLocation();
  const isAdmin = checkIsAdmin(user);

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          backgroundColor: "#D9D9D9",
          overflowX: "hidden",
        },
      }}
    >
      <Box sx={{ width: 240 }} role="presentation">
        <Box sx={{ padding: 2, textAlign: "center", height: 190 }}>
          <img
            src={nolimitsLogo}
            alt="No Limits for Deaf Children Logo"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </Box>

        <List sx={{ padding: "0 8px" }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            return (
              <ListItem key={item.text} disablePadding sx={{ margin: "4px 0" }}>
                <ListItemButton
                  component={Link}
                  to={item.to}
                  sx={{
                    borderRadius: "8px",
                    ...(isActive && {
                      backgroundColor: "white",
                      "&:hover": {
                        backgroundColor: "white",
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ "& svg": { fontSize: "2.2rem" } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "1.3rem",
                      sx: { pt: 1, pb: 1 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: "0 8px",
          }}
        >
          <List>
            <ListItem disablePadding sx={{ margin: "4px 0" }}>
              <ListItemButton
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                sx={{ borderRadius: "8px" }}
              >
                <ListItemIcon sx={{ "& svg": { fontSize: "2.2rem" } }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: "1.3rem" }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};
