import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { FloatingSyncButton } from '@/components/FloatingSyncButton';
import DevWorkerDebugPanel from '@/components/DevWorkerDebugPanel';
import Header from '@/components/navigation/Header';
import AppProvider from '@/providers/AppProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import stylesToast from '@/components/Toast.module.css';
import { ToastProvider } from '@/providers/ToastProvider';
import * as RadixToast from '@radix-ui/react-toast';

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
                    <AuthProvider withGuard>
                        <ToastProvider>
                            <AppProvider>
                                <Header />
                                <FloatingSyncButton />
                                {process.env.NODE_ENV !== 'production' && (
                                    <DevWorkerDebugPanel />
                                )}
                                {children}
                            </AppProvider>
                        </ToastProvider>
                    </AuthProvider>
                </Theme>
            </body>
        </html>
    );
}
