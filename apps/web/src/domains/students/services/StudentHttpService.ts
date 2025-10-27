import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

export function useStudentHttpService(): IHttpService {
  const httpClient = useHttpClient()

  return {
    key: 'students',
    mutations: {
      create: async (payload: any) => {
        const response = await httpClient.post(`/v1/students`, payload)
        return response.data
      },
      show: async (id: string) => {
        const response = await httpClient.get(`/v1/students/${id}`)
        return response.data
      },
      linkTeacher: async (studentId: string, payload: any) => {
        const response = await httpClient.post(`/v1/students/${studentId}/link-teacher`, payload)
        return response.data
      },
      uploadDocument: async (studentId: string, payload: any) => {
        const response = await httpClient.post(`/v1/students/${studentId}/upload`, payload)
        return response.data
      }
    },
    queries: {

    }
  }
}


