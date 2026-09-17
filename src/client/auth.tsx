"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { getMe } from "@/client/me";

export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  authEnabled: true;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  isUnassigned: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshSession: () => Promise<void>;
};

/**
 * Better-auth React client.
 *
 * Same-origin note: in the new single Next.js app the browser and the
 * better-auth API live on the same origin, so the cross-origin localStorage
 * Bearer-token workaround from the legacy Vite app is no longer needed —
 * session cookies are handled entirely by better-auth.
 */
export const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const {
    data: sessionData,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession();
  const sessionUser = sessionData?.user ?? null;

  const {
    data: appUser,
    isPending: mePending,
    refetch: refetchMe,
  } = useQuery({
    // The app role lives in the No Limits UserTable (not better-auth), so the
    // session alone is not enough — fetch the app profile once signed in.
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(sessionUser?.id),
    staleTime: 30_000,
  });

  // Keep the "me" query in sync with session sign-in/out.
  useEffect(() => {
    if (!sessionUser?.id) {
      void queryClient.removeQueries({ queryKey: ["me"] });
    }
  }, [sessionUser?.id, queryClient]);

  const user = useMemo<AuthUser | null>(() => {
    if (!appUser || !sessionUser) return null;
    return {
      id: appUser.id,
      name: appUser.name || sessionUser.name,
      email: appUser.email || sessionUser.email,
      role: appUser.role as UserRole,
    };
  }, [appUser, sessionUser]);

  const roleLoading = sessionUser?.id ? mePending : false;

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(user);

    return {
      authEnabled: true,
      isAuthenticated,
      isLoading: sessionPending || roleLoading,
      user: isAuthenticated ? user : null,
      login: async () => {
        window.location.href = "/login";
      },
      logout: async () => {
        await authClient.signOut();
        void queryClient.clear();
        window.location.href = "/login";
      },
      isAdmin: user?.role === "administrator",
      isTeacher: user?.role === "teacher",
      isParent: user?.role === "parent",
      isUnassigned: user?.role === "unassigned",
      hasRole: (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
      refreshSession: async () => {
        await Promise.all([refetchSession(), refetchMe()]);
      },
    };
  }, [user, sessionPending, roleLoading, queryClient, refetchSession, refetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}

export function useRoleAccess(...allowedRoles: UserRole[]) {
  const { user, hasRole, isLoading } = useAuth();

  return {
    isAllowed: hasRole(...allowedRoles),
    isLoading,
    userRole: user?.role,
  };
}
