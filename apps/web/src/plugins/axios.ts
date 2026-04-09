import axios from "axios";
import { getAuthToken } from "../auth";

export function useHttpClient() {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });

  // Attach Bearer token to every request (for cross-origin production).
  // Cookies are still sent via withCredentials for same-origin local dev.
  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}
