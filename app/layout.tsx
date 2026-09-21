import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDC CTF — Enter the Grid",
  description:
    "Same curiosity. Higher privileges. A 24-hour Capture the Flag event by Digital Defence Club, CBIT, Hyderabad.",
  other: {
    "codex-preview": "development",
  },
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
