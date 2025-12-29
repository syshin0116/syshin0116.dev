import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syshin's AI Portfolio Assistant",
  description:
    "Chat with AI about Syshin's projects, blog posts, and technical expertise. Powered by RAG technology.",
  keywords: [
    "Portfolio",
    "AI Assistant",
    "RAG",
    "LangGraph",
    "Syshin",
    "Blog",
    "Projects",
    "Technical Portfolio",
    "AI Chatbot",
    "Developer Portfolio",
  ],
  openGraph: {
    type: "website",
    siteName: "Syshin's Portfolio",
    locale: "en_US",
    url: "https://portfolio-web.vercel.app",
    title: "Syshin's AI Portfolio Assistant",
    description:
      "Chat with AI about Syshin's projects, blog posts, and technical expertise. Powered by RAG technology.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Syshin's Portfolio Preview",
      },
    ],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
