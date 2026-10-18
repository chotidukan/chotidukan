import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kesariya — Your neighbourhood, delivered",
  description: "Good groceries. Great neighbours. Discover local kirana stores, build one basket, and follow every delivery. An interactive marketplace demo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
