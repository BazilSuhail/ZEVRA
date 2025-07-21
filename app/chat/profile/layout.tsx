import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile & Settings",
  description:
    "View your Zevra profile and manage appearance, ringtone and account preferences.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
