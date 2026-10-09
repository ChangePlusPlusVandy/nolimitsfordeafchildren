import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vinext on Cloudflare — keep route handlers on the default (nodejs)
  // runtime. No adapter-specific config lives here.
};

export default nextConfig;
