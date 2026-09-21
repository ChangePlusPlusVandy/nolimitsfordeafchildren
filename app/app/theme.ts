"use client";

import { alpha, createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteColor {
    50?: string;
  }
  interface SimplePaletteColorOptions {
    50?: string;
  }
}

const brandNavy = "#1e3e67";
const brandOrange = "#f79460";

/**
 * Brand theme (ported from the legacy Vite app's theme.ts).
 */
const theme = createTheme({
  palette: {
    primary: {
      main: brandNavy,
      light: "#2d5a94",
      dark: "#142b48",
      contrastText: "#ffffff",
      50: alpha(brandNavy, 0.06),
    },
    secondary: {
      main: brandOrange,
      light: "#f9b08a",
      dark: "#d4703c",
      contrastText: "#ffffff",
      50: alpha(brandOrange, 0.08),
    },
    success: {
      main: "#2e7d32",
      light: "#4caf50",
      dark: "#1b5e20",
      50: alpha("#2e7d32", 0.06),
    },
    warning: {
      main: "#ed6c02",
      light: "#ff9800",
      dark: "#e65100",
      50: alpha("#ed6c02", 0.06),
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
      dark: "#c62828",
      50: alpha("#d32f2f", 0.06),
    },
    info: {
      main: "#0288d1",
      light: "#03a9f4",
      dark: "#01579b",
      50: alpha("#0288d1", 0.06),
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.35rem",
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.1rem",
      lineHeight: 1.4,
    },
    subtitle2: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f5f5f5",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        },
        elevation0: {
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#fafafa",
            fontWeight: 600,
            color: "rgba(0,0,0,0.6)",
            borderBottom: "2px solid rgba(0,0,0,0.08)",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "1.15rem",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginLeft: 8,
          marginRight: 8,
          marginBottom: 2,
          "&.Mui-selected": {
            backgroundColor: alpha(brandNavy, 0.1),
            "&:hover": {
              backgroundColor: alpha(brandNavy, 0.15),
            },
            "& .MuiListItemIcon-root": {
              color: brandNavy,
            },
            "& .MuiListItemText-primary": {
              fontWeight: 600,
              color: brandNavy,
            },
          },
        },
      },
    },
  },
});

export default theme;
