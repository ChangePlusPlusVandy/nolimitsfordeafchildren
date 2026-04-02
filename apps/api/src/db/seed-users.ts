/**
 * Seed Test Users Script
 * Creates test auth accounts using Better Auth's sign-up API
 *
 * This script:
 * 1. Signs up 3 test users via Better Auth (handles password hashing)
 * 2. Updates their roles in the app users table
 * 3. Creates teacher/parent profiles as needed
 *
 * Run with: npm run db:seed-users
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { auth } from "../auth";
import {
  UserTable,
  TeacherProfileTable,
  ParentProfileTable,
} from "./schema";

// ==================== TEST USERS ====================

const TEST_USERS = [
  {
    email: "admin@nolimitsfordeafchildren.org",
    name: "Test Admin",
    password: "Password123!",
    role: "administrator" as const,
  },
  {
    email: "teacher@nolimitsfordeafchildren.org",
    name: "Test Teacher",
    password: "Password123!",
    role: "teacher" as const,
  },
  {
    email: "parent@nolimitsfordeafchildren.org",
    name: "Test Parent",
    password: "Password123!",
    role: "parent" as const,
  },
];

// ==================== MAIN ====================

async function seedUsers() {
  console.log("Starting test user seed...\n");

  for (const testUser of TEST_USERS) {
    console.log(`--- ${testUser.role.toUpperCase()}: ${testUser.email} ---`);

    // Check if user already exists in app users table
    const [existingAppUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, testUser.email.toLowerCase()));

    if (existingAppUser?.authUserId) {
      console.log(`  Already exists with auth linked. Ensuring role is ${testUser.role}...`);
      await db
        .update(UserTable)
        .set({ role: testUser.role, updated_at: new Date() })
        .where(eq(UserTable.id, existingAppUser.id));
      console.log(`  Done.\n`);
      continue;
    }

    // Sign up via Better Auth (creates auth_users + auth_accounts with hashed password)
    console.log("  Signing up via Better Auth...");
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      },
    });

    if (!signUpResult?.user) {
      console.error(`  Failed to sign up ${testUser.email}. Result:`, signUpResult);
      continue;
    }

    console.log(`  Auth user created: ${signUpResult.user.id}`);

    // The ensureAppUser hook should have fired and created/linked the app user.
    // Now update the role from "unassigned" to the correct role.
    const [appUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, testUser.email.toLowerCase()));

    if (!appUser) {
      console.error(`  App user not found after sign-up for ${testUser.email}`);
      continue;
    }

    console.log(`  App user: ${appUser.id} (current role: ${appUser.role})`);

    // Update role
    await db
      .update(UserTable)
      .set({ role: testUser.role, updated_at: new Date() })
      .where(eq(UserTable.id, appUser.id));
    console.log(`  Role updated to: ${testUser.role}`);

    // Create teacher profile if needed
    if (testUser.role === "teacher") {
      const [existingProfile] = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, appUser.id));

      if (!existingProfile) {
        await db.insert(TeacherProfileTable).values({
          user_id: appUser.id,
        });
        console.log("  Teacher profile created.");
      } else {
        console.log("  Teacher profile already exists.");
      }
    }

    // Create parent profile if needed
    if (testUser.role === "parent") {
      const [existingProfile] = await db
        .select()
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, appUser.id));

      if (!existingProfile) {
        await db.insert(ParentProfileTable).values({
          user_id: appUser.id,
          preferred_contact_method: "email",
        });
        console.log("  Parent profile created.");
      } else {
        console.log("  Parent profile already exists.");
      }
    }

    console.log("  Done.\n");
  }

  // ==================== SUMMARY ====================
  console.log("=".repeat(50));
  console.log("Test user seed completed!");
  console.log("=".repeat(50));
  console.log("\nTest Accounts:");
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(15)} ${u.email} / ${u.password}`);
  }

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
