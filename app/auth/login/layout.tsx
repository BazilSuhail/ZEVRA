import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In to Zevra",
  description:
    "Sign in to your Zevra account with zero-knowledge SRP-6a authentication. Your password is never transmitted.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
