import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useParentHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'parents',
    mutations: {
      myStudents: async () => {
        const response = await httpClient.get(`/v1/parents/my-students`)
        return response.data
      }
    },
    queries: {

    }
  }
}


