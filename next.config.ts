import withSerwistInit from "@serwist/next";
import { randomUUID } from "node:crypto";
import type { NextConfig } from "next";

const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  // App shell routes: precached so the app opens offline after first load.
  additionalPrecacheEntries: ["/", "/calendar", "/reports", "/settings", "/routines"].map((url) => ({ url, revision })),
});

const nextConfig: NextConfig = { reactStrictMode: true };

export default withSerwist(nextConfig);
