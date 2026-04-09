import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createAuthClient } from "better-auth/react";

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

type SessionUser = {
  id: string;
  name: string;
  email: string;
};

type SessionResponse = {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
};

type AuthMeResponse = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  locale: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Token helpers – persist the Better Auth session token in localStorage so it
// survives page reloads and can be sent as an Authorization header (required
// when the API and web app are on different origins and cross-origin cookies
// are blocked, e.g. DigitalOcean App Platform *.ondigitalocean.app).
// ---------------------------------------------------------------------------

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage may be unavailable (e.g. private browsing quota exceeded)
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Better Auth client – sends both cookies (for same-origin / local dev) and
// the Bearer token header (for cross-origin production).
// ---------------------------------------------------------------------------

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: {
    credentials: "include",
    onRequest(context) {
      const token = getAuthToken();
      if (token) {
        context.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  },
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchAppUser(): Promise<AuthMeResponse | null> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/auth/me`, {
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<AuthMeResponse> & { error?: string };
  if ("error" in data || !data.id || !data.email || !data.name || !data.role) {
    return null;
  }

  return data as AuthMeResponse;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, refetch } = authClient.useSession();
  const session = (data ?? null) as SessionResponse | null;

  const [appUser, setAppUser] = useState<AuthUser | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [resolvedSessionUserId, setResolvedSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sessionUserId = session?.user?.id ?? null;

    async function syncAppUser() {
      if (!sessionUserId || !session?.user) {
        setAppUser(null);
        setRoleLoading(false);
        setResolvedSessionUserId(null);
        return;
      }

      setRoleLoading(true);
      try {
        const me = await fetchAppUser();

        if (cancelled) return;

        if (!me) {
          setAppUser(null);
          return;
        }

        setAppUser({
          id: me.id,
          name: me.name || session.user.name,
          email: me.email || session.user.email,
          role: me.role,
        });
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
          setResolvedSessionUserId(sessionUserId);
        }
      }
    }

    void syncAppUser();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  const value = useMemo<AuthContextValue>(() => {
    const hasSessionUser = Boolean(session?.user);
    const isSessionResolved = !session?.user || resolvedSessionUserId === session.user.id;
    const isAuthenticated = Boolean(hasSessionUser && appUser && isSessionResolved);

    return {
      authEnabled: true,
      isAuthenticated,
      isLoading: isPending || (hasSessionUser && (!isSessionResolved || roleLoading)),
      user: isAuthenticated ? appUser : null,
      login: async () => {
        window.location.href = "/login";
      },
      logout: async () => {
        await authClient.signOut();
        clearAuthToken();
        setAppUser(null);
        window.location.href = "/login";
      },
      isAdmin: appUser?.role === "administrator",
      isTeacher: appUser?.role === "teacher",
      isParent: appUser?.role === "parent",
      isUnassigned: appUser?.role === "unassigned",
      hasRole: (...roles: UserRole[]) => (appUser ? roles.includes(appUser.role) : false),
      refreshSession: async () => {
        await refetch();
      },
    };
  }, [appUser, isPending, refetch, roleLoading, resolvedSessionUserId, session?.user]);

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
