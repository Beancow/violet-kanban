'use client';
import React from 'react';
import { BoardProvider } from './BoardProvider';
import { ListProvider } from './ListProvider';
import { CardProvider } from './CardProvider';
import { QueueProvider } from './QueueProvider';
import { TempIdMapProvider } from './TempIdMapProvider';
import OrganizationProvider from './OrganizationProvider';
import SyncErrorProvider from './SyncErrorProvider';
import ReconciliationProvider from './ReconciliationProvider';
import SyncManager from '@/components/SyncManager';
import { UiProvider } from './UiProvider';
import ToastProvider from './ToastProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <UiProvider>
            <TempIdMapProvider>
                <OrganizationProvider>
                    <SyncErrorProvider>
                        <BoardProvider>
                            <ListProvider>
                                <CardProvider>
                                    <QueueProvider>
                                        <ReconciliationProvider>
                                            <SyncManager />
                                            {children}
                                        </ReconciliationProvider>
                                    </QueueProvider>
                                </CardProvider>
                            </ListProvider>
                        </BoardProvider>
                    </SyncErrorProvider>
                </OrganizationProvider>
            </TempIdMapProvider>
        </UiProvider>
    );
}

export default AppProvider;
