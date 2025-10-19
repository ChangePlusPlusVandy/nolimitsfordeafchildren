import { Service, Inject } from "typedi";
import { UserRepository } from "../repositories/UserRepository";
import type { UserProjection } from "../projections/UserProjection";

@Service()
export class UserService {
  constructor(
    @Inject(() => UserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async getById(id: string): Promise<UserProjection | undefined> {
    return await this.userRepository.getById(id);
  }
}