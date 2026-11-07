"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/(auth)/_domain/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: "/reset-password",
      });

      if (result.error) {
        // Surface a clear admin-facing message when email isn't configured.
        const msg = result.error.message ?? "";
        if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("disabled")) {
          throw new Error(
            "Email delivery is not configured on this server. " +
              "An administrator must set EMAIL_FROM_ADDRESS and the Cloudflare send_email binding.",
          );
        }
        throw new Error(msg || "Unable to send reset email");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 5,
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                component="img"
                src="/nolimitslogo.png"
                alt="No Limits for Deaf Children"
                sx={{ height: 88, width: "auto" }}
              />
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom>
                Forgot password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email and we&apos;ll send you a reset link if an account exists.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {submitted ? (
              <Alert severity="success">
                If that email is registered, a reset link is on its way. Check your inbox.
              </Alert>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={submitting}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || !email}
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {submitting ? "Sending..." : "Send reset link"}
                  </Button>
                </Stack>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary">
              Remember your password?{" "}
              <Button
                component={Link}
                href="/login"
                variant="text"
                size="small"
                sx={{ p: 0, minWidth: "auto", verticalAlign: "baseline" }}
              >
                Sign in
              </Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
