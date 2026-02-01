import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            bgcolor: "#f5f5f5",
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              width: "100%",
              textAlign: "center",
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 64, color: "error.main", mb: 2 }}
              aria-hidden="true"
            />
            <Typography variant="h5" component="h1" gutterBottom>
              Something went wrong
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              We're sorry, but an unexpected error occurred. Please try again
              or reload the page.
            </Typography>

            {import.meta.env.DEV && this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "grey.100",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                >
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </Typography>
              </Paper>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleRetry}
                startIcon={<RefreshIcon />}
                aria-label="Try again"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReload}
                aria-label="Reload page"
              >
                Reload Page
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
