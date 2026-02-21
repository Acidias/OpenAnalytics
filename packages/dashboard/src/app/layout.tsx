import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAnalytics — Privacy-first web analytics",
  description: "Open-source, cookie-free web analytics with session tracking, funnels, and real-time insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
