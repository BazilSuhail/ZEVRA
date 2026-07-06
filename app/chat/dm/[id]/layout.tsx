import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Direct Message",
    description: `Encrypted direct message conversation on Zevra.`,
    robots: { index: false, follow: false },
  };
}

export default function DMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
