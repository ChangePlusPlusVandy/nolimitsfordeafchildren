import { Service } from "typedi";
import type { UserRepository } from "../repositories/UserRepository";
import type { UserProjection } from "../projections/UserProjection";

@Service()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async getById(id: string): Promise<UserProjection | null> {
    return this.userRepository.getById(id);
  }
}