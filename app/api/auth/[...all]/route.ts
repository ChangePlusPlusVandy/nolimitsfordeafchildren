import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

/**
 * better-auth catch-all route — replaces the Express
 * `app.all("/api/auth/*splat", toNodeHandler(auth))` mount.
 *
 * The auth instance is created lazily (see src/lib/auth.ts) and MUST NOT be
 * evaluated at module scope: during `next build` route modules are evaluated
 * for page-data collection, and creating the better-auth instance touches
 * the `db` lazy proxy, which requires the request-scoped
 * `getCloudflareContext()` (throws at build time otherwise). `getAuth()` is
 * therefore deferred into the request handlers below.
 */
let handlers: ReturnType<typeof toNextJsHandler> | null = null;

function getHandlers() {
  if (!handlers) {
    handlers = toNextJsHandler(getAuth().handler);
  }
  return handlers;
}

export async function GET(request: Request): Promise<Response> {
  return getHandlers().GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return getHandlers().POST(request);
}
