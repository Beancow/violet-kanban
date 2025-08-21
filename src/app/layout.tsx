import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { FloatingSyncButton } from '@/components/FloatingSyncButton';
import { SyncManager } from '@/components/SyncManager';
import Header from '@/components/navigation/Header';
import QueueStoreProvider from '@/providers/QueueStoreProvider';
import AuthStoreProvider from '@/providers/AuthStoreProvider';
import BoardStoreProvider from '@/providers/BoardStoreProvider';
import ListStoreProvider from '@/providers/ListStoreProvider';
import CardStoreProvider from '@/providers/CardStoreProvider';

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
                    <Header />
                    <FloatingSyncButton />
                    <SyncManager />
                    <AuthStoreProvider>
                        <BoardStoreProvider>
                            <ListStoreProvider>
                                <CardStoreProvider>
                                    <QueueStoreProvider>
                                        {children}
                                    </QueueStoreProvider>
                                </CardStoreProvider>
                            </ListStoreProvider>
                        </BoardStoreProvider>
                    </AuthStoreProvider>
                </Theme>
            </body>
        </html>
    );
}
