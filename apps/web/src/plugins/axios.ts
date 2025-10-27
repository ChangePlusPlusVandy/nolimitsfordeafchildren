import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

export function useHttpClient() {
  const auth = useAuth0()
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  })

  instance.interceptors.request.use(async (config) => {
    const token = await auth.getAccessTokenSilently()

    if (token) {
     config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  return instance
}