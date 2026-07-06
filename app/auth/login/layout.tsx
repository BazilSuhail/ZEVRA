import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Login to Zevra, the zero-knowledge encrypted chat platform. SRP-6a authentication — your password never leaves your device.",
  keywords: [
    "zevra login",
    "zevra chat login",
    "encrypted chat login",
    "secure messaging login",
    "zero-knowledge login",
    "E2EE chat login",
    "bazil suhail",
  ],
  openGraph: {
    title: "Login to Zevra | Encrypted Chat",
    description:
      "Login to Zevra — zero-knowledge encrypted chat. SRP-6a authentication keeps your password private.",
    url: "https://zevra-chat.netlify.app/auth/login",
  },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://zevra-chat.netlify.app/auth/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
