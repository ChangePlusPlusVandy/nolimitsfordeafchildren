import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/_platform/auth/server";

/**
 * Defer better-auth initialization until a request supplies Worker bindings.
 * Build-time route evaluation must not touch the lazy auth or D1 instances.
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
