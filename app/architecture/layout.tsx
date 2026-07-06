import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zevra Architecture | Zero-Knowledge Encrypted Chat Infrastructure",
  description:
    "Deep dive into Zevra's cryptographic architecture: SRP-6a authentication, X25519/Ed25519 key exchange, AES-256-GCM encryption, Redis and BullMQ multi-node real-time messaging. Built by Bazil Suhail.",
  keywords: [
    "zevra architecture",
    "zevra crypto",
    "E2EE architecture",
    "SRP-6a authentication",
    "X25519 key exchange",
    "AES-256-GCM encryption",
    "zero-knowledge architecture",
    "encrypted chat infrastructure",
    "bazil suhail",
  ],
  openGraph: {
    title: "Zevra Architecture | Zero-Knowledge Encrypted Chat Infrastructure",
    description:
      "Technical deep dive into Zevra's E2EE architecture: SRP-6a, X25519, AES-256-GCM, Redis, BullMQ. Built by Bazil Suhail.",
    url: "https://zevra-chat.netlify.app/architecture",
    images: [
      {
        url: "/og-architecture.png",
        width: 1200,
        height: 630,
        alt: "Zevra cryptographic architecture diagram",
      },
    ],
  },
  alternates: {
    canonical: "https://zevra-chat.netlify.app/architecture",
  },
};

export default function ArchitectureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
