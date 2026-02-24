import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAnalytics — Privacy-first web analytics",
  description: "Open-source, cookie-free web analytics with session tracking, funnels, and real-time insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script defer data-site="qpxG4Ij8" data-token-id="vMhuUcji" data-token="b2715e8abd7d04049283d3acdb50d01f7df4baed5433356c1135386046acab9a" src="https://analytics.mihaly-dani.com/oa.js"></script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
