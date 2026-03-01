import { Service } from "typedi";
import Container from "@/container";
import { UserRepository } from "../repositories/UserRepository";
import type { UserProjection } from "../projections/UserProjection";
import type { UserEntity } from "../models/entities/UserTable";

export interface IUserService {
  getById(id: string): Promise<UserProjection | undefined>;
  getByAuth0Id(auth0Id: string): Promise<UserProjection | undefined>;
  insert(user: Omit<UserEntity, "id">): Promise<UserProjection>;
}

@Service()
export class UserService implements IUserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = Container.get(UserRepository);
  }

  async getById(id: string): Promise<UserProjection | undefined> {
    return await this.userRepository.getById(id);
  }

  async getByAuth0Id(auth0Id: string): Promise<UserProjection | undefined> {
    return await this.userRepository.getByAuth0Id(auth0Id);
  }

  async insert(user: Omit<UserEntity, "id">): Promise<UserProjection> {
    return await this.userRepository.insert(user);
  }
}
