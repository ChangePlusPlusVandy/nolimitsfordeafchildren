import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { db } from "@/db";
import { ParentProfileTable, TeacherProfileTable, UserTable } from "@/db/schema";

const bootstrapAdminEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type AuthUserPayload = {
  id: string;
  email: string;
  name?: string | null;
};

function shouldBootstrapAdmin(email: string): boolean {
  return bootstrapAdminEmails.includes(email.toLowerCase());
}

export async function ensureAppUser(authUser: AuthUserPayload) {
  const normalizedEmail = authUser.email.toLowerCase();

  const existingByAuthUserId = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.authUserId, authUser.id))
    .limit(1);

  if (existingByAuthUserId[0]) {
    return existingByAuthUserId[0];
  }

  const existingByEmail = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, normalizedEmail))
    .limit(1);

  if (existingByEmail[0]) {
    const existingUser = existingByEmail[0];
    const shouldPromoteToAdmin =
      shouldBootstrapAdmin(normalizedEmail) && existingUser.role === "unassigned";

    const updated = await db
      .update(UserTable)
      .set({
        authUserId: authUser.id,
        ...(shouldPromoteToAdmin ? { role: "administrator" as const } : {}),
        updated_at: new Date(),
      })
      .where(eq(UserTable.id, existingUser.id))
      .returning();

    return updated[0] ?? existingUser;
  }

  const role = shouldBootstrapAdmin(normalizedEmail) ? "administrator" : "unassigned";
  const inserted = await db
    .insert(UserTable)
    .values({
      authUserId: authUser.id,
      email: normalizedEmail,
      name: authUser.name?.trim() || normalizedEmail.split("@")[0] || "User",
      phone: null,
      locale: "en-US",
      role,
      is_active: true,
    })
    .returning();

  return inserted[0] ?? null;
}

async function ensureRoleProfiles(
  userId: string,
  role: "administrator" | "teacher" | "parent" | "unassigned",
) {
  if (role === "teacher") {
    const existing = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    if (!existing[0]) {
      await db.insert(TeacherProfileTable).values({ user_id: userId });
    }
  }

  if (role === "parent") {
    const existing = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, userId))
      .limit(1);

    if (!existing[0]) {
      await db.insert(ParentProfileTable).values({ user_id: userId });
    }
  }
}

export const auth = betterAuth({
  appName: "No Limits for Deaf Children",
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
      auth_users: schema.AuthUserTable,
      auth_sessions: schema.AuthSessionTable,
      auth_accounts: schema.AuthAccountTable,
      auth_verifications: schema.AuthVerificationTable,
      user: schema.AuthUserTable,
      session: schema.AuthSessionTable,
      account: schema.AuthAccountTable,
      verification: schema.AuthVerificationTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
  user: {
    modelName: "auth_users",
  },
  session: {
    modelName: "auth_sessions",
  },
  account: {
    modelName: "auth_accounts",
  },
  verification: {
    modelName: "auth_verifications",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (authUser: AuthUserPayload) => {
          const appUser = await ensureAppUser(authUser);
          if (appUser) {
            await ensureRoleProfiles(appUser.id, appUser.role);
          }
        },
      },
      update: {
        after: async (authUser: AuthUserPayload) => {
          const appUser = await ensureAppUser(authUser);
          if (appUser) {
            await db
              .update(UserTable)
              .set({
                name: authUser.name?.trim() || appUser.name,
                email: authUser.email.toLowerCase(),
                updated_at: new Date(),
              })
              .where(eq(UserTable.id, appUser.id));
          }
        },
      },
    },
  },
});
