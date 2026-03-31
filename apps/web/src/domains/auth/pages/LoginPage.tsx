import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { authClient, useAuth } from "../../../auth";
import nolimitsLogo from "../../../assets/nolimitslogo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshSession } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === "unassigned") {
      navigate("/pending-approval", { replace: true });
      return;
    }

    if (user.role === "administrator") {
      navigate("/users", { replace: true });
      return;
    }

    if (user.role === "teacher") {
      navigate("/my-day", { replace: true });
      return;
    }

    navigate("/my-students", { replace: true });
  }, [isAuthenticated, navigate, user]);

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
        backgroundImage:
          "radial-gradient(circle at top left, rgba(14,59,92,0.12), transparent 42%), radial-gradient(circle at bottom right, rgba(28,137,201,0.12), transparent 38%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 4, boxShadow: 8 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                component="img"
                src={nolimitsLogo}
                alt="No Limits for Deaf Children"
                sx={{
                  height: 88,
                  width: "auto",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1,
                  bgcolor: "common.white",
                }}
              />
            </Box>

            <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </Typography>
            <Typography color="text.secondary">
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
                  disabled={submitting || !email || !password || (mode === "signup" && !name.trim())}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {submitting ? "Please wait..." : submitLabel}
                </Button>
              </Stack>
            </Box>

            <Typography variant="body2" color="text.secondary">
              {mode === "login" ? "Need an account? " : "Already have an account? "}
              <Link
                to="#"
                onClick={(event) => {
                  event.preventDefault();
                  setError(null);
                  setMode((prev) => (prev === "login" ? "signup" : "login"));
                }}
                style={{ color: "inherit", fontWeight: 700 }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
