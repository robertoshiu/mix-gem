import type { Metadata } from "next";
import { Providers } from "./providers";
import { ToastContainer } from '@/components/alerts/toast-container';
import "./globals.css";

export const metadata: Metadata = {
  title: "Equipment Monitor",
  description: "Semiconductor equipment monitoring dashboard",
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
          <ToastContainer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
