import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({}),
  // OpenNext runs the app's `build` script to produce `.next` and defaults to
  // `pnpm build` based on the lockfile. Our `build` script IS
  // `opennextjs-cloudflare build`, which would recurse infinitely — so point it
  // at the underlying Next.js build instead.
  buildCommand: "next build",
};
