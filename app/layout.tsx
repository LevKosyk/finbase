import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import PostHogProvider from "@/components/providers/PostHogProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import WebVitalsTracker from "@/components/providers/WebVitalsTracker";
import PWAProvider from "@/components/providers/PWAProvider";
import { validateEnvironmentSecurity } from "@/lib/env-security";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  preload: true,
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Finbase",
    default: "Finbase",
  },
  description: "Modern financial management platform for FOPs",
  icons: {
    icon: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  validateEnvironmentSecurity();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <PWAProvider />
            <WebVitalsTracker />
            <ToastProvider>{children}</ToastProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
