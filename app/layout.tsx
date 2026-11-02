import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shell/Providers";
import { AppShell } from "@/components/shell/AppShell";
import { STORAGE_KEY } from "@/lib/storage";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "RoutineBuddy",
  description: "A cute daily, weekly and monthly routine tracker that lives on your device.",
  applicationName: "RoutineBuddy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "RoutineBuddy", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1925" },
  ],
};

// Runs before paint: applies saved theme + palette so there's no flash.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}').state||{};var st=(s.profile&&s.profile.settings)||{};var t=st.theme||'auto';var d=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d)e.classList.add('dark');e.dataset.palette=st.palette||'candy';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
