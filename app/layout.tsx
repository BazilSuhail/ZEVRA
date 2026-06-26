import type { Metadata } from "next";
import "./globals.css";
import ClientProvider from "@/components/layout/ClientProvider";

export const metadata: Metadata = {
  title: "Zevra",
  description: "End-to-end encrypted messaging",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <ClientProvider>{children}</ClientProvider>;
}
