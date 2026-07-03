import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/providers";

export const metadata: Metadata = {
  title: "Zevra",
  description: "End-to-end encrypted messaging",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
