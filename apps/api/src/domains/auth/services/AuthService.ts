import { Service } from "typedi";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { UserTable, type UserEntity, type UserInsert } from "@/db/schema";

export interface IAuthService {
  /**
   * Get or create user from Auth0 callback
   * Called when a user authenticates via Auth0
   */
  handleCallback(auth0User: Auth0UserInput): Promise<UserEntity>;

  /**
   * Get current user by Auth0 ID
   */
  getUserByAuth0Id(auth0Id: string): Promise<UserEntity | null>;

  /**
   * Create a new user from Auth0 data
   */
  createUserFromAuth0(auth0User: Auth0UserInput): Promise<UserEntity>;
}

/**
 * Auth0 user data - must be a class for routing-controllers body transformation
 */
export class Auth0UserInput {
  sub!: string; // Auth0 user ID
  email!: string;
  name?: string;
  picture?: string;
}

// Keep interface for backward compatibility
export type Auth0User = Auth0UserInput;

@Service()
export class AuthService implements IAuthService {
  /**
   * Handle Auth0 callback - get or create user
   */
  async handleCallback(auth0User: Auth0UserInput): Promise<UserEntity> {
    // Try to find existing user
    const existingUser = await this.getUserByAuth0Id(auth0User.sub);

    if (existingUser) {
      return existingUser;
    }

    // Create new user if not found
    return this.createUserFromAuth0(auth0User);
  }

  /**
   * Get user by Auth0 ID
   */
  async getUserByAuth0Id(auth0Id: string): Promise<UserEntity | null> {
    const users = await db.select().from(UserTable).where(eq(UserTable.auth0Id, auth0Id)).limit(1);

    return users[0] ?? null;
  }

  /**
   * Create a new user from Auth0 data
   * Default role is 'parent' - admin must change role if needed
   */
  async createUserFromAuth0(auth0User: Auth0UserInput): Promise<UserEntity> {
    const newUser: UserInsert = {
      auth0Id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name || auth0User.email.split("@")[0] || "User",
      phone: null,
      photo_url: auth0User.picture || null,
      locale: "en-US",
      role: "parent", // Default role - admin can change
      is_active: true,
    };

    const result = await db.insert(UserTable).values(newUser).returning();

    return result[0]!;
  }

  /**
   * Legacy methods for backward compatibility
   * These are no longer used with Auth0 but kept for API compatibility
   */
  async login(_input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    // With Auth0, login is handled by the Auth0 SDK on the frontend
    // This endpoint is deprecated
    throw new Error("Direct login is disabled. Please use Auth0 authentication.");
  }

  async refresh(_input: { refreshToken: string }): Promise<{ accessToken: string }> {
    // With Auth0, token refresh is handled by the Auth0 SDK on the frontend
    throw new Error("Token refresh is handled by Auth0 SDK.");
  }

  async logout(): Promise<void> {
    // With Auth0, logout is handled by the Auth0 SDK on the frontend
    // This endpoint can be used to clean up server-side sessions if needed
    return;
  }
}
