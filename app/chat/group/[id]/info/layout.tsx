import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Info",
  description: "View details of this encrypted group chat on Zevra.",
  robots: { index: false, follow: false },
};

export default function GroupInfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
