import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Syshin's Portfolio",
    template: "%s | Syshin's Portfolio",
  },
  description:
    "AI Engineer portfolio & tech blog. Projects, blog posts, and technical expertise.",
  keywords: [
    "Portfolio",
    "AI Engineer",
    "RAG",
    "LangGraph",
    "Syshin",
    "Blog",
    "Projects",
    "Technical Portfolio",
  ],
  metadataBase: new URL("https://syshin0116.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "Syshin's Portfolio",
    locale: "ko_KR",
    url: "https://syshin0116.vercel.app",
    title: "Syshin's Portfolio",
    description:
      "AI Engineer portfolio & tech blog.",
  },
  twitter: {
    card: "summary",
    title: "Syshin's Portfolio",
    description: "AI Engineer portfolio & tech blog.",
  },
  authors: [
    {
      name: "Syshin",
      url: "https://github.com/syshin0116",
    },
  ],
  creator: "Syshin",
  icons: [
    {
      rel: "icon",
      url: "/logo.png",
    },
    {
      rel: "apple-touch-icon",
      url: "/logo.png",
    },
  ],
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "j5FT4jTGt4vceZ-Tgn0gf5q1VHp1VNTtBcbYC1VUBFE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
