import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.heroMotion='boot';setTimeout(function(){delete document.documentElement.dataset.heroMotion},2400)}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
