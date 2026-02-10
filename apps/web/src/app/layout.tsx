import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ocula AI - AI that Sees, Speaks, and Guides",
    template: "%s | Ocula AI",
  },
  description:
    "Embed agentic vision and real-time voice guidance into your SaaS in 4 lines of code. Turn any interface into an intelligent, guided experience.",
  keywords: ["AI", "SaaS", "visual support", "screen sharing", "Gemini 3", "Agentic Vision", "Voice AI"],
  authors: [{ name: "Ocula AI Team" }],
  creator: "Ocula AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ocula.ai",
    title: "Ocula AI - AI that Sees, Speaks, and Guides",
    description: "Embed agentic vision and real-time voice guidance into your SaaS in 4 lines of code.",
    siteName: "Ocula AI",
    images: [
      {
        url: "/og-image.png", // Assuming this exists or will exist
        width: 1200,
        height: 630,
        alt: "Ocula AI Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ocula AI - AI that Sees, Speaks, and Guides",
    description: "Embed agentic vision and real-time voice guidance into your SaaS in 4 lines of code.",
    images: ["/og-image.png"],
    creator: "@ocula_ai",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground min-h-screen overflow-x-hidden`}
      >
        <div className="fixed inset-0 z-50 pointer-events-none noise-overlay opacity-[0.03]"></div>
        <div className="fixed inset-0 z-0 pointer-events-none bg-dev-grid opacity-10"></div>
        {children}
      </body>
    </html>
  );
}
