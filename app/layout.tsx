import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "No Limits for Deaf Children",
  description: "Help deaf children speak, learn, and dream.",
};

// Auth + D1/R2 bindings are request-scoped (`getCloudflareContext` is sync).
// Without this, `next build` prerenders RSC pages like /users and the
// OpenNext sync context throws, failing CI.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
