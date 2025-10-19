export interface IHttpService {
  key: string
  mutations: {
    [key: string]: (...args: any[]) => Promise<any>
  }
  queries: {
    [key: string]: (...args: any[]) => Promise<any>
  }
}