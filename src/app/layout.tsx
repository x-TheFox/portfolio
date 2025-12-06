import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Analytics } from "@vercel/analytics/next";

import { PersonaProvider } from "@/hooks/usePersona";
import { ConsentBanner } from "@/components/tracking/ConsentBanner";
import { BehaviorTracker } from "@/components/tracking/BehaviorTracker";
import { Observer } from "@/components/ui/Observer";
import { MobilePrompt } from "@/components/ui/MobilePrompt";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { DevTools } from "@/components/ui/DevTools";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Adaptive Developer | AI-Augmented Portfolio",
  description:
    "A highly adaptive, AI-augmented portfolio that learns from your behavior and personalizes your experience.",
  keywords: [
    "developer",
    "portfolio",
    "AI",
    "adaptive",
    "full-stack",
    "software engineer",
  ],
  authors: [{ name: "The Adaptive Developer" }],
  openGraph: {
    title: "The Adaptive Developer",
    description: "An AI-augmented portfolio that adapts to you",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Adaptive Developer",
    description: "An AI-augmented portfolio that adapts to you",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <PersonaProvider>
          {/* GDPR Consent Banner */}
          <ConsentBanner />

          {/* Behavior Tracking (only active after consent) */}
          <BehaviorTracker />

          {/* Main Content */}
          <main className="min-h-screen">{children}</main>

          {/* Persona Adaptation Indicator */}
          <Observer />

          {/* Mobile Desktop Prompt */}
          <MobilePrompt />

          {/* AI Chat Widget */}
          <ChatWidget />

          {/* Dev Tools (only in development) */}
          <DevTools />
        </PersonaProvider>
        <Analytics />
      </body>
    </html>
  );
}
