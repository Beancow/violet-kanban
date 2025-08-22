import React from 'react';
import { BoardProvider } from './BoardProvider';
import { ListProvider } from './ListProvider';
import { CardProvider } from './CardProvider';
import { QueueProvider } from './QueueProvider';
import { TempIdMapProvider } from './TempIdMapProvider';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <TempIdMapProvider>
            <BoardProvider>
                <ListProvider>
                    <CardProvider>
                        <QueueProvider>{children}</QueueProvider>
                    </CardProvider>
                </ListProvider>
            </BoardProvider>
        </TempIdMapProvider>
    );
}

export default AppProvider;
