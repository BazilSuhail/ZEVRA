"use client";

import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import Providers from "@/utils/providers";
import { Suspense } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white">
        <Providers>
          <ThemeProvider>
            <Suspense>{children}</Suspense>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
