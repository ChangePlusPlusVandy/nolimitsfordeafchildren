import axios from "axios";
import { useAuth } from "../auth";

export function useHttpClient() {
  const auth = useAuth();
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  instance.interceptors.request.use(async (requestConfig) => {
    const token = await auth.getAccessToken();

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    // In dev mode, send the current role to the API
    if (!auth.authEnabled && auth.user?.role) {
      requestConfig.headers["X-Dev-Role"] = auth.user.role;
    }

    return requestConfig;
  });

  return instance;
}
