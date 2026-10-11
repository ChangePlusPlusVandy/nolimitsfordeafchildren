import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  type UserEntity,
  UserTable,
} from "@/_platform/db/schema";

import type { UserWithLinkedStudents } from "../_domain/types";

export async function getUser(id: string): Promise<UserEntity | null> {
  const users = await db.select().from(UserTable).where(eq(UserTable.id, id)).limit(1);

  return users[0] ?? null;
}

export async function getByEmail(email: string): Promise<UserEntity | null> {
  const users = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email.toLowerCase()))
    .limit(1);

  return users[0] ?? null;
}

export async function getUserWithStudents(id: string): Promise<UserWithLinkedStudents | null> {
  const user = await getUser(id);
  if (!user) {
    return null;
  }

  if (user.role !== "parent") {
    return { ...user, linked_students: [] };
  }

  const parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, id))
    .limit(1);

  if (parentProfile.length === 0) {
    return { ...user, linked_students: [] };
  }

  const links = await db
    .select({
      link_id: ParentStudentLinkTable.id,
      student_id: StudentTable.id,
      initials: StudentTable.initials,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      relationship: ParentStudentLinkTable.relationship,
      is_primary: ParentStudentLinkTable.is_primary,
      linked_at: ParentStudentLinkTable.linked_at,
    })
    .from(ParentStudentLinkTable)
    .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .orderBy(asc(StudentTable.last_name), asc(StudentTable.first_name));

  return { ...user, linked_students: links };
}
