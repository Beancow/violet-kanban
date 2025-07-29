import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { AuthProvider } from '@/components/AuthProvider';
import { AppStateProvider } from '@/components/AppStateProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'A Kanban Board',
    description: 'A Kanban board application built with Next.js and Radix UI.',
};

export default function UserLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Theme {...{ isRoot: false }}>
            <AuthProvider>
                <AppStateProvider>{children}</AppStateProvider>
            </AuthProvider>
        </Theme>
    );
}
