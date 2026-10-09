import type { Metadata } from "next";

import EmotionCacheProvider from "@/client/components/EmotionCacheProvider";

import Providers from "./providers";

export const metadata: Metadata = {
  title: "No Limits for Deaf Children",
  description: "Help deaf children speak, learn, and dream.",
};

// Auth + D1/R2 bindings are request-scoped. Without this, the build
// prerenders RSC pages like /users without bindings, failing CI.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmotionCacheProvider>
          <Providers>{children}</Providers>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
