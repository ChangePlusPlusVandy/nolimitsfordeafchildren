import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useLocationHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'locations',
    mutations: {
      create: async (payload: any) => {
        const response = await httpClient.post(`/v1/locations`, payload)
        return response.data
      },
      update: async (siteId: string, payload: any) => {
        const response = await httpClient.put(`/v1/locations/${siteId}`, payload)
        return response.data
      },
      show: async (id: string) => {
        const response = await httpClient.get(`/v1/locations/${id}`)
        return response.data
      }
    },
    queries: {
      index: async () => {
        const response = await httpClient.get(`/v1/locations`)
        return response.data
      }
    }
  }
}


