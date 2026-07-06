import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/providers";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://zevra-chat.netlify.app"),
  title: {
    default: "Zevra | Zero-Knowledge Encrypted Chat & Video",
    template: "%s | Zevra",
  },
  description:
    "Zevra is a zero-knowledge, end-to-end encrypted real-time chat and video conferencing platform built by Bazil Suhail. Your privacy, guaranteed.",
  keywords: [
    "zevra",
    "zevra chat",
    "bazil suhail",
    "encrypted chat",
    "end-to-end encrypted chat",
    "zero-knowledge messaging",
    "encrypted video conferencing",
    "private messaging app",
    "E2EE chat",
    "secure messaging",
    "SRP-6a authentication",
    "AES-256-GCM encryption",
  ],
  authors: [{ name: "Bazil Suhail" }],
  creator: "Bazil Suhail",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zevra-chat.netlify.app",
    siteName: "Zevra",
    title: "Zevra | Zero-Knowledge Encrypted Chat & Video",
    description:
      "Zero-knowledge, end-to-end encrypted real-time chat and video conferencing. Built by Bazil Suhail.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zevra - Zero-Knowledge Encrypted Messaging Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zevra | Zero-Knowledge Encrypted Chat & Video",
    description:
      "Zero-knowledge, end-to-end encrypted real-time chat and video conferencing. Built by Bazil Suhail.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://zevra-chat.netlify.app",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
