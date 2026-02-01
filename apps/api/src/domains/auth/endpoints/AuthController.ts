import { Body, Get, JsonController, Post, Req } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import type { Request } from "express";
import { AuthService, Auth0UserInput } from "../services/AuthService";

/**
 * Auth callback endpoint
 * Called after successful Auth0 authentication to sync user data
 */
@Service()
@JsonController("/v1/auth")
export class AuthCallbackController {
  private get authService(): AuthService {
    return Container.get(AuthService);
  }

  /**
   * POST /v1/auth/callback
   * Called by frontend after Auth0 login to ensure user exists in our database
   */
  @Post("/callback")
  async handleCallback(@Body() body: Auth0UserInput) {
    const user = await this.authService.handleCallback(body);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    };
  }
}

/**
 * Get current user endpoint
 * Returns the authenticated user's information
 */
@Service()
@JsonController("/v1/auth")
export class GetAuthMeController {
  /**
   * GET /v1/auth/me
   * Get current authenticated user
   * Requires authentication
   */
  @Get("/me")
  async getCurrentUser(@Req() req: Request) {
    const user = req.currentUser;
    
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      locale: user.locale,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }
}

/**
 * Logout endpoint (legacy)
 * With Auth0, logout is handled client-side
 */
@Service()
@JsonController("/v1/auth")
export class PostAuthLogoutController {
  private get authService(): AuthService {
    return Container.get(AuthService);
  }

  @Post("/logout")
  async handle() {
    await this.authService.logout();
    return { success: true, message: "Logged out" };
  }
}

// Legacy controllers for backward compatibility
// These will return errors directing users to use Auth0

@Service()
@JsonController("/v1")
export class PostAuthLoginController {
  @Post("/auth/login")
  async handle() {
    return { 
      error: "Direct login is disabled",
      message: "Please use Auth0 authentication via the frontend" 
    };
  }
}

@Service()
@JsonController("/v1")
export class PostAuthRefreshController {
  @Post("/auth/refresh")
  async handle() {
    return { 
      error: "Token refresh is disabled",
      message: "Token refresh is handled by Auth0 SDK on the frontend" 
    };
  }
}
