import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useUserHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'users',
    mutations: {
      invite: async (payload: any) => {
        const response = await httpClient.post(`/v1/users/invite`, payload)
        return response.data
      },
      show: async (id: string) => {
        const response = await httpClient.get(`/v1/users/${id}`)
        return response.data
      },
      myProfile: async () => {
        const response = await httpClient.get(`/v1/users/my-profile`)
        return response.data
      }
    },
    queries: {
      index: async () => {
        const response = await httpClient.get(`/v1/users`)
        return response.data
      }
    }
  }
}