export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zevra",
    alternateName: "Zevra Chat",
    description:
      "Zero-knowledge, end-to-end encrypted real-time chat and video conferencing platform with SRP-6a authentication, X25519/Ed25519 key exchange, and AES-256-GCM encryption. Built by Bazil Suhail.",
    url: "https://zevra.app",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: "Bazil Suhail",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Zero-Knowledge End-to-End Encryption (E2EE)",
      "SRP-6a Password Authentication",
      "X25519/Ed25519 Key Exchange",
      "AES-256-GCM Message Encryption",
      "Real-time Chat and Video Conferencing",
      "Open Source and Auditable Code",
      "Multi-Node Architecture with Redis and BullMQ",
    ],
    screenshot: "https://zevra.app/screenshot.png",
    softwareVersion: "1.0",
    datePublished: "2026-01-01",
    keywords: "zevra, zevra chat, bazil suhail, encrypted messaging, e2ee, zero-knowledge",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
