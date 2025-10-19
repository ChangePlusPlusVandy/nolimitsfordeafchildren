import { Service } from "typedi";
import { UserProjection } from "../projections/UserProjection";
import { db } from "@/db";
import { UserTable, type UserEntity } from "@/domains/users/models/entities/UserTable";
import { eq } from "drizzle-orm";

export interface IUserRepository {
  getById(id: string): Promise<UserProjection | undefined>;
  getByAuth0Id(auth0Id: string): Promise<UserProjection | undefined>;
  insert(user: Omit<UserEntity, "id">): Promise<UserProjection>;
}

@Service()
export class UserRepository implements IUserRepository {
  async getById(id: string): Promise<UserProjection | undefined> {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.id, id));
    if (user === undefined) return undefined;

    return new UserProjection(user.id)
  }

  async getByAuth0Id(auth0Id: string): Promise<UserProjection | undefined> {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.auth0Id, auth0Id));
    if (user === undefined) return undefined;

    return new UserProjection(user.id)
  }

  async insert(user: Omit<UserEntity, "id">): Promise<UserProjection> {
    const [newUser] = await db.insert(UserTable).values(user).returning();
    if (newUser === undefined) throw new Error("Failed to insert user");

    return new UserProjection(newUser.id)
  }
}