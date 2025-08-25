'use client';
import React from 'react';
import { BoardProvider } from './BoardProvider';
import { ListProvider } from './ListProvider';
import { CardProvider } from './CardProvider';
import { QueueProvider } from './QueueProvider';
import { TempIdMapProvider } from './TempIdMapProvider';
import OrganizationProvider from './OrganizationProvider';
import { AuthProvider } from './AuthProvider';
import SyncErrorProvider from './SyncErrorProvider';
import { SyncManager } from '@/components/SyncManager';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <TempIdMapProvider>
            <OrganizationProvider>
                <SyncErrorProvider>
                    <BoardProvider>
                        <ListProvider>
                            <CardProvider>
                                <QueueProvider>
                                    <SyncManager />
                                    {children}
                                </QueueProvider>
                            </CardProvider>
                        </ListProvider>
                    </BoardProvider>
                </SyncErrorProvider>
            </OrganizationProvider>
        </TempIdMapProvider>
    );
}

export default AppProvider;
