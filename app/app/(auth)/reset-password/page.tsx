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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { authClient } from "@/(auth)/_domain/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Surfaces clearly when the link is invalid or expired (e.g. after
  // requestPasswordResetCallback redirects here with ?error=INVALID_TOKEN).
  const linkError = searchParams.get("error");

  if (linkError) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="error">
          This reset link is invalid or has already been used. Please request a new one.
        </Alert>
        <Button component={Link} href="/forgot-password" variant="contained">
          Request new link
        </Button>
      </Stack>
    );
  }

  if (!token) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="warning">
          No reset token found. Please use the link from your reset email.
        </Alert>
        <Button component={Link} href="/forgot-password" variant="contained">
          Request reset link
        </Button>
      </Stack>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        const msg = result.error.message ?? "";
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
          throw new Error("This reset link is invalid or has expired. Please request a new one.");
        }
        throw new Error(msg || "Unable to reset password");
      }

      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <Alert severity="success">Password updated! Redirecting to sign in…</Alert>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting || !newPassword || !confirmPassword}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : "Set new password"}
        </Button>
      </Stack>
    </Box>
  );
}

export default function ResetPasswordPage() {
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
                Set new password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a strong password for your account.
              </Typography>
            </Box>

            {/* useSearchParams requires a Suspense boundary */}
            <Suspense fallback={<CircularProgress size={24} />}>
              <ResetPasswordForm />
            </Suspense>

            <Typography variant="body2" color="text.secondary">
              <Button
                component={Link}
                href="/login"
                variant="text"
                size="small"
                sx={{ p: 0, minWidth: "auto", verticalAlign: "baseline" }}
              >
                Back to sign in
              </Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
