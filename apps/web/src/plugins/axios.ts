import axios from "axios";

export function useHttpClient() {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });

  return instance;
}
