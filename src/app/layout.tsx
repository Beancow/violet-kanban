import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import AppProviders from '@/contexts/AppProviders';
import { FloatingSyncButton } from '@/app/components/FloatingSyncButton';
import { SyncManager } from '@/components/SyncManager';
import Header from '@/app/components/navigation/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'A Kanban Board',
    description: 'A Kanban board application built with Next.js and Radix UI.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body className={inter.className}>
                <Theme>
                    <AppProviders>
                        <Header />
                        <FloatingSyncButton />
                        <SyncManager />
                        {children}
                    </AppProviders>
                </Theme>
            </body>
        </html>
    );
}
