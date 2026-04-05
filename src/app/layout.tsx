import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudySphere — AI Study Companion",
  description: "Transform your study materials into personalized learning resources with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${syne.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
