"use client";

import type { ReactNode } from "react";
import RequireRole from "@/client/components/RequireRole";

/**
 * Renders children only for administrators; others are redirected away.
 */
export default function RequireAdmin({
  children,
  redirectTo = "/my-day",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <RequireRole roles={["administrator"]} redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}
