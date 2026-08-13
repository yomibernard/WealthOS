import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WealthOS — Know what you have. Know where you are going.",
  description:
    "Nigeria-first AI Personal Wealth Operating System. Understand your net worth, financial health, goals and next best actions.",
  applicationName: "WealthOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WealthOS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1F2A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
