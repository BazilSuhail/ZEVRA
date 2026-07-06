import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your Zevra account. Zero-knowledge encrypted chat — sign up for private, end-to-end encrypted messaging built by Bazil Suhail.",
  keywords: [
    "zevra register",
    "zevra sign up",
    "encrypted chat sign up",
    "secure messaging register",
    "zero-knowledge chat register",
    "E2EE chat register",
    "bazil suhail",
  ],
  openGraph: {
    title: "Register for Zevra | Encrypted Chat",
    description:
      "Create your Zevra account — zero-knowledge encrypted chat with SRP-6a authentication.",
    url: "https://zevra-chat.netlify.app/auth/register",
  },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://zevra-chat.netlify.app/auth/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
