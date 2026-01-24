import React, { createContext, useContext, useMemo } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import config from "./config";

type AuthContextValue = {
  authEnabled: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AuthContextValue>(() => {
    return {
      authEnabled: false,
      isAuthenticated: true,
      isLoading: false,
      user: {
        name: "Dev User",
        email: "dev@example.com",
        role: "Administrator",
      },
      login: async () => {},
      logout: () => {
        window.location.reload();
      },
      getAccessToken: async () => "",
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Auth0Bridge({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const value = useMemo<AuthContextValue>(() => {
    return {
      authEnabled: true,
      isAuthenticated,
      isLoading,
      user,
      login: async () => {
        await loginWithRedirect();
      },
      logout: () => {
        logout({ logoutParams: { returnTo: window.location.origin } });
      },
      getAccessToken: async () => {
        return await getAccessTokenSilently();
      },
    };
  }, [
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    user,
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
