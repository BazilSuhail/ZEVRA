import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account on Zevra",
  description:
    "Create your Zevra account with zero-knowledge encryption. Join thousands of users who trust Zevra for secure, encrypted communication.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
