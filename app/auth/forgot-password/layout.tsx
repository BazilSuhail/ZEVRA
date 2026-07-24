import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Why Zevra can't reset your password: with zero-knowledge end-to-end encryption, only your password can unlock your keys.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://zevra-chat.netlify.app/auth/forgot-password",
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
