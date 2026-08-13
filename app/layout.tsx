import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One — AI Dashboard",
  description: "Open-source, self-hosted dashboard for chatting with and orchestrating AI models and agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
