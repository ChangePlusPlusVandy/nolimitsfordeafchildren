import { UserRepository } from "./repositories/UserRepository";
import type { UserProjection } from "./projections/UserProjection";
import type { UserEntity } from "./models/entities/UserTable";

export interface IUserService {
  getById(id: string): Promise<UserProjection | undefined>;
  getByAuthUserId(authUserId: string): Promise<UserProjection | undefined>;
  insert(user: Omit<UserEntity, "id">): Promise<UserProjection>;
}

export class UserService implements IUserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getById(id: string): Promise<UserProjection | undefined> {
    return await this.userRepository.getById(id);
  }

  async getByAuthUserId(authUserId: string): Promise<UserProjection | undefined> {
    return await this.userRepository.getByAuthUserId(authUserId);
  }

  async insert(user: Omit<UserEntity, "id">): Promise<UserProjection> {
    return await this.userRepository.insert(user);
  }
}
