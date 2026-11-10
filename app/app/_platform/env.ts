import { createRequire } from "node:module";

/**
 * Worker env access for the Vinext (Cloudflare) runtime.
 *
 * App code reads bindings/vars here, never at module top-level.
 * `cloudflare:workers` is native in workerd (dev and prod) but missing
 * in plain Node (seed scripts, unit tests), so resolve it lazily and
 * fall back to `{}` outside workerd. `process.env` stays the fallback
 * for plain-string config in non-worker contexts.
 */

function readWorkerEnv(): Record<string, unknown> {
  try {
    const require = createRequire(import.meta.url);
    const mod = require("cloudflare:workers") as { env?: Record<string, unknown> };
    if (mod?.env) {
      return mod.env;
    }
  } catch {
    // Outside workerd: no worker env available.
  }
  return {};
}

/** Raw worker env (bindings + vars). Empty outside workerd. */
export function getWorkerEnv(): Record<string, unknown> {
  return readWorkerEnv();
}

/** String config: worker env first, `process.env` fallback. */
export function getEnvValue(key: string): string | undefined {
  const value = (readWorkerEnv() as Record<string, string | undefined>)[key];
  if (value !== undefined && value !== "") {
    return value;
  }
  return process.env[key];
}

/** Binding (D1/R2/Email): undefined when unavailable. */
export function getBinding<T>(key: string): T | undefined {
  return readWorkerEnv()[key] as T | undefined;
}
