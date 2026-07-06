import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversation Info",
  description: "View details of this encrypted conversation on Zevra.",
  robots: { index: false, follow: false },
};

export default function DMInfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
