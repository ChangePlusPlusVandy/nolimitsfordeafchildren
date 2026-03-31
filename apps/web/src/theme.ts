import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1f6ea5",
      light: "#4f92bd",
      dark: "#0f4d78",
    },
    secondary: {
      main: "#0f2b40",
      light: "#254a63",
      dark: "#081926",
    },
    background: {
      default: "#f4f8fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#132839",
      secondary: "#486072",
    },
    grey: {
      50: "#f9fbfc",
      100: "#eef3f7",
      200: "#dce6ee",
      300: "#c2d2df",
      400: "#97aec0",
      500: "#6f889c",
      600: "#526a7d",
      700: "#3e5465",
      800: "#283c4b",
      900: "#152a39",
    },
  },
  typography: {
    fontFamily: [
      '"Source Sans 3"',
      '"Segoe UI"',
      "system-ui",
      "-apple-system",
      "sans-serif",
    ].join(","),
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0f2b40",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // WCAG touch target size
          textTransform: "none",
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #dce6ee",
          boxShadow: "0 8px 24px rgba(15, 43, 64, 0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 18px rgba(9, 35, 52, 0.22)",
        },
      },
    },
  },
});
