import { useAuth0 } from "@auth0/auth0-react"
import type { IHttpService } from "../../../utils/IHttpService"

export function useUserHttpService(): IHttpService {
  const auth = useAuth0()

  return {
    key: 'users',
    mutations: {
      show: async (id: string) => undefined
    },
    queries: {

    }
  }
}