import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { AppStateProvider } from '@/components/AppStateProvider';
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A Kanban Board",
  description: "A Kanban board application built with Next.js and Radix UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme>
          <AuthProvider>
            <AppStateProvider>{children}</AppStateProvider>
          </AuthProvider>
        </Theme>
      </body>
    </html>
  );
}