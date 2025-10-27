import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useTeacherHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'teachers',
    mutations: {
      create: async (payload: any) => {
        const response = await httpClient.post(`/v1/teachers`, payload)
        return response.data
      },
      show: async (id: string) => {
        const response = await httpClient.get(`/v1/teachers/${id}`)
        return response.data
      },
      myDay: async () => {
        const response = await httpClient.get(`/v1/teachers/my-day`)
        return response.data
      },
      createSchedule: async (teacherId: string, payload: any) => {
        const response = await httpClient.post(`/v1/teachers/${teacherId}/schedules`, payload)
        return response.data
      }
    },
    queries: {

    }
  }
}


