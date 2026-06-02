import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { ToastContainer } from '@/components/alerts/toast-container';
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equipment Monitor",
  description: "Semiconductor equipment monitoring dashboard",
  // basePath hard-coded per repo convention (static export under /mix-gem)
  manifest: "/mix-gem/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "EquipMon",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/mix-gem/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/mix-gem/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/mix-gem/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <ServiceWorkerRegister />
          <ToastContainer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
