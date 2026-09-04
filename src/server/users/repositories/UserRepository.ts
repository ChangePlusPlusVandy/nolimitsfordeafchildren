import { UserProjection } from "../projections/UserProjection";
import { db } from "@/lib/db";
import { UserTable, type UserEntity } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface IUserRepository {
  getById(id: string): Promise<UserProjection | undefined>;
  getByAuthUserId(authUserId: string): Promise<UserProjection | undefined>;
  insert(user: Omit<UserEntity, "id">): Promise<UserProjection>;
}

export class UserRepository implements IUserRepository {
  async getById(id: string): Promise<UserProjection | undefined> {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.id, id));
    if (user === undefined) return undefined;

    return new UserProjection(user.id);
  }

  async getByAuthUserId(authUserId: string): Promise<UserProjection | undefined> {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.authUserId, authUserId));
    if (user === undefined) return undefined;

    return new UserProjection(user.id);
  }

  async insert(user: Omit<UserEntity, "id">): Promise<UserProjection> {
    const [newUser] = await db.insert(UserTable).values(user).returning();
    if (newUser === undefined) throw new Error("Failed to insert user");

    return new UserProjection(newUser.id);
  }
}
