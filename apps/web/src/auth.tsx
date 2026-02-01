import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import config from "./config";
import axios from "axios";

export type UserRole = "administrator" | "teacher" | "parent";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  picture?: string;
};

type AuthContextValue = {
  authEnabled: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Dev user IDs - must match the seed data and API auth middleware
 */
const DEV_USER_IDS = {
  ADMIN: "5126c34f-4393-406c-8683-c9b696c02f38",
  TEACHER: "cd7c3cb2-a14c-4a94-b320-b64ec164df2e",
  PARENT: "823e1615-9ec0-483e-910e-6cd27296712d",
} as const;

// Dev users for testing different roles
const DEV_USERS: Record<UserRole, AuthUser> = {
  administrator: {
    id: DEV_USER_IDS.ADMIN,
    name: "Dev Admin",
    email: "admin.dev@gmail.com",
    role: "administrator",
  },
  teacher: {
    id: DEV_USER_IDS.TEACHER,
    name: "Dev Teacher",
    email: "teacher.dev@gmail.com",
    role: "teacher",
  },
  parent: {
    id: DEV_USER_IDS.PARENT,
    name: "Dev Parent",
    email: "parent.dev@gmail.com",
    role: "parent",
  },
};

function DevAuthProvider({ children }: { children: React.ReactNode }) {
  // Check URL params for role override: ?role=administrator|teacher|parent
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get("role") as UserRole | null;
  
  // Store role in sessionStorage so it persists across navigation
  const storedRole = sessionStorage.getItem("devRole") as UserRole | null;
  
  // Priority: URL param > sessionStorage > default (administrator)
  const activeRole: UserRole = roleParam || storedRole || "administrator";
  
  // Update sessionStorage when URL param changes
  useEffect(() => {
    if (roleParam && roleParam !== storedRole) {
      sessionStorage.setItem("devRole", roleParam);
    }
  }, [roleParam, storedRole]);
  
  const devUser = DEV_USERS[activeRole];

  const value = useMemo<AuthContextValue>(() => {
    return {
      authEnabled: false,
      isAuthenticated: true,
      isLoading: false,
      user: devUser,
      login: async () => {},
      logout: () => {
        sessionStorage.removeItem("devRole");
        window.location.href = "/";
      },
      getAccessToken: async () => "",
      isAdmin: devUser.role === "administrator",
      isTeacher: devUser.role === "teacher",
      isParent: devUser.role === "parent",
      hasRole: (...roles: UserRole[]) => roles.includes(devUser.role),
    };
  }, [devUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Auth0Bridge({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [appUser, setAppUser] = useState<AuthUser | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Sync user with backend after Auth0 authentication
  useEffect(() => {
    async function syncUser() {
      if (!isAuthenticated || !auth0User) return;

      setSyncLoading(true);
      try {
        const token = await getAccessTokenSilently();
        
        // Call backend to ensure user exists and get their role
        const response = await axios.post(
          `${config.apiUrl}/v1/auth/callback`,
          {
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAppUser({
          id: response.data.id,
          name: response.data.name || auth0User.name || auth0User.email || "User",
          email: response.data.email || auth0User.email || "",
          role: response.data.role || "parent",
          picture: auth0User.picture,
        });
      } catch (error) {
        console.error("Failed to sync user with backend:", error);
        // Fall back to auth0 user data with default role
        setAppUser({
          name: auth0User.name || auth0User.email || "User",
          email: auth0User.email || "",
          role: "parent",
          picture: auth0User.picture,
        });
      } finally {
        setSyncLoading(false);
      }
    }

    syncUser();
  }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const isLoading = auth0Loading || syncLoading;

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!appUser) return false;
      return roles.includes(appUser.role);
    },
    [appUser]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      authEnabled: true,
      isAuthenticated,
      isLoading,
      user: appUser,
      login: async () => {
        await loginWithRedirect();
      },
      logout: () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
      },
      getAccessToken: async () => {
        return await getAccessTokenSilently();
      },
      isAdmin: appUser?.role === "administrator",
      isTeacher: appUser?.role === "teacher",
      isParent: appUser?.role === "parent",
      hasRole,
    };
  }, [
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    auth0Logout,
    appUser,
    hasRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth0Configured = Boolean(config.auth0.domain && config.auth0.clientId);
  const authDisabled =
    import.meta.env.VITE_AUTH_DISABLED === "true" || !auth0Configured;

  if (authDisabled) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }

  return (
    <Auth0Provider
      domain={config.auth0.domain}
      clientId={config.auth0.clientId}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(config.auth0.audience && { audience: config.auth0.audience }),
      }}
    >
      <Auth0Bridge>{children}</Auth0Bridge>
    </Auth0Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}

/**
 * Hook for role-based access control in components
 * @example
 * const { isAllowed } = useRoleAccess("administrator", "teacher");
 * if (!isAllowed) return <AccessDenied />;
 */
export function useRoleAccess(...allowedRoles: UserRole[]) {
  const { user, hasRole, isLoading } = useAuth();
  
  return {
    isAllowed: hasRole(...allowedRoles),
    isLoading,
    userRole: user?.role,
  };
}
