import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Your encrypted Zevra chat workspace. End-to-end encrypted messages.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Zevra Chat",
    description: "Encrypted messaging workspace",
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
