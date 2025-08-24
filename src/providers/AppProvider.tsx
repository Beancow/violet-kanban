'use client';
import React from 'react';
import { BoardProvider } from './BoardProvider';
import { ListProvider } from './ListProvider';
import { CardProvider } from './CardProvider';
import { QueueProvider } from './QueueProvider';
import { TempIdMapProvider } from './TempIdMapProvider';
import OrganizationProvider from './OrganizationProvider';
import AuthProvider from './AuthProvider';
import SyncErrorProvider from './SyncErrorProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <TempIdMapProvider>
            <AuthProvider>
                <OrganizationProvider>
                    <SyncErrorProvider>
                        <BoardProvider>
                            <ListProvider>
                                <CardProvider>
                                    <QueueProvider>{children}</QueueProvider>
                                </CardProvider>
                            </ListProvider>
                        </BoardProvider>
                    </SyncErrorProvider>
                </OrganizationProvider>
            </AuthProvider>
        </TempIdMapProvider>
    );
}

export default AppProvider;
