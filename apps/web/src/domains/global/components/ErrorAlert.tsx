import { Alert, Button, type SxProps, type Theme } from "@mui/material";

interface ErrorAlertProps {
  message?: string;
  /** If provided, renders a "Retry" button. */
  onRetry?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Standard error alert with optional retry button.
 * Replaces the pattern of `<Alert>` + "try again" text with no actual retry action.
 */
export default function ErrorAlert({
  message = "Something went wrong. Please try again.",
  onRetry,
  sx,
}: ErrorAlertProps) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 2, ...sx }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
