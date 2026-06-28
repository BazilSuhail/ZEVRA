import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/utils/providers";

export const metadata: Metadata = {
  title: "Zevra",
  description: "End-to-end encrypted messaging",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
