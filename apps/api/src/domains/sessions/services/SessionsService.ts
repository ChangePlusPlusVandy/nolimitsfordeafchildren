import { Service } from "typedi";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { SessionTable, type SessionEntity, type SessionInsert } from "@/db/schema";

export interface ListSessionsQuery {
  include_archived?: boolean;
  active_only?: boolean;
}

export interface CreateSessionInput {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface UpdateSessionInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_archived?: boolean;
}

@Service()
export class SessionsService {
  async index(query: ListSessionsQuery): Promise<{ items: SessionEntity[] }> {
    const conditions = [];

    if (!query.include_archived) {
      conditions.push(eq(SessionTable.is_archived, false));
    }

    if (query.active_only) {
      const today = new Date().toISOString().split("T")[0]!;
      conditions.push(eq(SessionTable.is_active, true));
      conditions.push(lte(SessionTable.start_date, today));
      conditions.push(gte(SessionTable.end_date, today));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(SessionTable)
      .where(whereClause)
      .orderBy(asc(SessionTable.start_date));

    return { items };
  }

  async create(input: CreateSessionInput): Promise<SessionEntity> {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Session name is required");
    }

    if (input.start_date >= input.end_date) {
      throw new Error("Session end date must be after start date");
    }

    const duplicate = await db
      .select({ id: SessionTable.id })
      .from(SessionTable)
      .where(
        and(
          eq(SessionTable.name, name),
          eq(SessionTable.start_date, input.start_date),
          eq(SessionTable.end_date, input.end_date),
          eq(SessionTable.is_archived, false),
        ),
      )
      .limit(1);

    if (duplicate.length > 0) {
      throw new Error("A matching session already exists");
    }

    const payload: SessionInsert = {
      name,
      start_date: input.start_date,
      end_date: input.end_date,
      is_active: input.is_active ?? true,
      is_archived: false,
    };

    const result = await db.insert(SessionTable).values(payload).returning();
    return result[0]!;
  }

  async update(id: string, input: UpdateSessionInput): Promise<SessionEntity | null> {
    const existing = await db
      .select()
      .from(SessionTable)
      .where(eq(SessionTable.id, id))
      .limit(1);

    if (!existing[0]) {
      return null;
    }

    const nextStartDate = input.start_date ?? existing[0].start_date;
    const nextEndDate = input.end_date ?? existing[0].end_date;

    if (nextStartDate >= nextEndDate) {
      throw new Error("Session end date must be after start date");
    }

    const updateData: Partial<SessionInsert> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.is_archived !== undefined) {
      updateData.is_archived = input.is_archived;
      if (input.is_archived) {
        updateData.is_active = false;
      }
    }

    const result = await db
      .update(SessionTable)
      .set(updateData)
      .where(eq(SessionTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  async getCurrentSession(): Promise<SessionEntity | null> {
    const today = new Date().toISOString().split("T")[0]!;

    const rows = await db
      .select()
      .from(SessionTable)
      .where(
        and(
          eq(SessionTable.is_archived, false),
          eq(SessionTable.is_active, true),
          lte(SessionTable.start_date, today),
          gte(SessionTable.end_date, today),
        ),
      )
      .orderBy(sql`abs(extract(epoch from (${SessionTable.start_date}::timestamp - now())))`)
      .limit(1);

    return rows[0] ?? null;
  }
}
