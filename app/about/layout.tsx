import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Zevra | Built by Bazil Suhail",
  description:
    "Learn about Zevra, the zero-knowledge encrypted chat platform built by Bazil Suhail. Our mission: make private, secure communication accessible to everyone through E2EE and SRP-6a authentication.",
  openGraph: {
    title: "About Zevra | Built by Bazil Suhail",
    description:
      "Learn about Zevra's mission to make private, secure communication accessible to everyone. Built by Bazil Suhail.",
    url: "https://zevra.app/about",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "About Zevra - Zero-Knowledge Encrypted Messaging by Bazil Suhail",
      },
    ],
  },
  alternates: {
    canonical: "https://zevra.app/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
