import { Service } from "typedi";

@Service()
export class ParentsService {
  async myChildren() {
    return { items: [] }
  }

  async childDetail(_studentId: string) {
    return { id: _studentId }
  }
}




