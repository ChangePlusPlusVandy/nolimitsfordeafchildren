import axios from "axios";
import { useAuth } from "../auth";

export function useHttpClient() {
  const auth = useAuth();
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });

  instance.interceptors.request.use(async (requestConfig) => {
    const devModeEnabled = import.meta.env.VITE_AUTH_DISABLED === "true";

    if (devModeEnabled && auth.user?.role) {
      requestConfig.headers["X-Dev-Role"] = auth.user.role;
    }

    return requestConfig;
  });

  return instance;
}
