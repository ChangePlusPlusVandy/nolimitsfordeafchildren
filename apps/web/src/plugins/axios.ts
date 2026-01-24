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

    return requestConfig;
  });

  return instance;
}
