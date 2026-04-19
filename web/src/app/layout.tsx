import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRIS - IMPROVE RESUME  INTELLIGENCE STUDIO",
  description: "AI-powered resume optimization with 3 AI providers. Analyze, rewrite, and export ATS-optimized CVs.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
