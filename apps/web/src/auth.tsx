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

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: {
    credentials: "include",
  },
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchAppUser(): Promise<AuthMeResponse | null> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/auth/me`, {
    credentials: "include",
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
  const authDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";

  if (authDisabled) {
    const storedRole = (sessionStorage.getItem("devRole") as UserRole | null) || "administrator";
    const devRole: UserRole =
      storedRole === "administrator" ||
      storedRole === "teacher" ||
      storedRole === "parent" ||
      storedRole === "unassigned"
        ? storedRole
        : "administrator";

    const devUser: AuthUser = {
      id: `dev-${devRole}`,
      name:
        devRole === "administrator"
          ? "Dev Admin"
          : devRole === "teacher"
            ? "Dev Teacher"
            : devRole === "parent"
              ? "Dev Parent"
              : "Pending User",
      email: `${devRole}.dev@example.com`,
      role: devRole,
    };

    const value: AuthContextValue = {
      authEnabled: true,
      isAuthenticated: true,
      isLoading: false,
      user: devUser,
      login: async () => {
        window.location.href = "/login";
      },
      logout: async () => {
        sessionStorage.removeItem("devRole");
        window.location.href = "/login";
      },
      isAdmin: devUser.role === "administrator",
      isTeacher: devUser.role === "teacher",
      isParent: devUser.role === "parent",
      isUnassigned: devUser.role === "unassigned",
      hasRole: (...roles: UserRole[]) => roles.includes(devUser.role),
      refreshSession: async () => {},
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  const { data, isPending, refetch } = authClient.useSession();
  const session = (data ?? null) as SessionResponse | null;

  const [appUser, setAppUser] = useState<AuthUser | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncAppUser() {
      if (!session?.user) {
        setAppUser(null);
        setRoleLoading(false);
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
        }
      }
    }

    void syncAppUser();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(session?.user && appUser);

    return {
      authEnabled: true,
      isAuthenticated,
      isLoading: isPending || (!!session?.user && roleLoading),
      user: isAuthenticated ? appUser : null,
      login: async () => {
        window.location.href = "/login";
      },
      logout: async () => {
        await authClient.signOut();
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
  }, [appUser, isPending, refetch, roleLoading, session?.user]);

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
