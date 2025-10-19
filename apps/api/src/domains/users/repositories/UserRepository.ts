import { Service } from "typedi";
import type { UserProjection } from "../projections/UserProjection";
import { db } from "@/db";
import { UserTable } from "@/domains/users/models/entities/UserTable";
import { eq } from "drizzle-orm";

export interface IUserRepository {
  getById(id: string): Promise<UserProjection | undefined>;
}

@Service()
export class UserRepository implements IUserRepository {
  async getById(id: string): Promise<UserProjection | undefined> {
    const [user] = await db.select().from(UserTable).where(eq(UserTable.id, id));
    if (user === undefined) return undefined;

    return user as UserProjection
  }
}