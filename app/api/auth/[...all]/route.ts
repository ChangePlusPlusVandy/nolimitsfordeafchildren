import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

/**
 * better-auth catch-all route — replaces the Express
 * `app.all("/api/auth/*splat", toNodeHandler(auth))` mount.
 *
 * The auth instance is created lazily (see src/lib/auth.ts); `getAuth()`
 * only reads config/env, so evaluating it at module scope in the worker is
 * safe (no adapter queries run until the first request hits the handler).
 */
const { GET, POST } = toNextJsHandler(getAuth().handler);

export { GET, POST };
