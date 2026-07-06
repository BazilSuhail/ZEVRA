import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encryption Keys",
  description: "Manage your Zevra X25519 encryption keys. View key fingerprints and rotate keys.",
  robots: { index: false, follow: false },
};

export default function KeysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
