import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equipment Monitor Dashboard",
  description: "Real-time semiconductor equipment monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
