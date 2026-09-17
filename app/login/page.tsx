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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient, useAuth } from "@/client/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, refreshSession } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Same-origin app: session cookies are handled by better-auth, so there is
    // no token to persist (the legacy app stored one in localStorage for
    // cross-origin Bearer auth).
    if (user.role === "unassigned") {
      router.replace("/pending-approval");
      return;
    }

    if (user.role === "administrator") {
      router.replace("/users");
      return;
    }

    if (user.role === "teacher") {
      router.replace("/my-day");
      return;
    }

    router.replace("/my-students");
  }, [isAuthenticated, user, router]);

  const submitLabel = mode === "login" ? "Sign In" : "Create Account";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });

        if (result.error) {
          throw new Error(result.error.message || "Unable to sign in");
        }
      } else {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        if (result.error) {
          throw new Error(result.error.message || "Unable to create account");
        }
      }

      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
                {mode === "login" ? "Welcome back" : "Create your account"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === "login"
                  ? "Sign in to continue to your dashboard."
                  : "New accounts are created as pending until an administrator approves your role."}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {mode === "signup" && (
                  <TextField
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    disabled={submitting}
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  disabled={submitting}
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={submitting}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={
                    submitting || !email || !password || (mode === "signup" && !name.trim())
                  }
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {submitting ? "Please wait..." : submitLabel}
                </Button>
              </Stack>
            </Box>

            <Typography variant="body2" color="text.secondary">
              {mode === "login" ? "Need an account? " : "Already have an account? "}
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setError(null);
                  setMode((prev) => (prev === "login" ? "signup" : "login"));
                }}
                sx={{ p: 0, minWidth: "auto", verticalAlign: "baseline" }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
