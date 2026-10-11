"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { AuthProvider } from "@/(auth)/_domain/client";
import ErrorBoundary from "@/_shared/ui/ErrorBoundary";
import { ToastProvider } from "@/_shared/ui/ToastProvider";

import theme from "./theme";

/**
 * Client-side providers for the whole app (wired into the root layout):
 * - MUI theme + CssBaseline
 * - React Query (server actions/queries are called through it)
 * - better-auth session + app-role auth context
 * - Toast/snackbar provider
 * - Error boundary
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
