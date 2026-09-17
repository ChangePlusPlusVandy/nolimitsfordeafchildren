import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OpenNext on Cloudflare — the Node.js runtime is required (edge is
  // deprecated/broken in Next 16 + OpenNext). Keep route handlers on the
  // default (nodejs) runtime.
};

export default nextConfig;

// Initializes OpenNext Cloudflare bindings (D1/R2/Email) for plain `next dev`.
// Must run after the config above — it is async and does not need awaiting.
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
