import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useBulletinHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'bulletin',
    mutations: {
      index: async () => {
        const response = await httpClient.get(`/v1/bulletin`)
        return response.data
      }
    },
    queries: {

    }
  }
}


