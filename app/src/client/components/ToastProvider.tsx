"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Alert, type AlertColor, IconButton, Snackbar } from "@mui/material";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  action?: ReactNode;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
  action?: ReactNode;
}

/**
 * Global snackbar/toast provider (ported from the legacy Vite app).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
    duration: 4000,
  });

  const showToast = useCallback((options: ToastOptions) => {
    setToast({
      open: true,
      message: options.message,
      severity: options.severity ?? "info",
      duration: options.duration ?? 4000,
      action: options.action,
    });
  }, []);

  const success = useCallback(
    (message: string) => {
      showToast({ message, severity: "success" });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string) => {
      showToast({ message, severity: "error", duration: 6000 });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string) => {
      showToast({ message, severity: "warning" });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string) => {
      showToast({ message, severity: "info" });
    },
    [showToast],
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", alignItems: "center" }}
          action={
            <>
              {toast.action}
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          }
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
