import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Group Chat",
    description: `Encrypted group chat conversation on Zevra.`,
    robots: { index: false, follow: false },
  };
}

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
