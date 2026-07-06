import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Center",
  description: "Audit trail of your Zevra account activity and security events.",
  robots: { index: false, follow: false },
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
