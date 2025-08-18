'use client';
import { useData } from '@/contexts/DataProvider';
import { useState } from 'react';
import styles from './FloatingSyncButton.module.css';
import { Flex } from '@radix-ui/themes';
import { UpdateIcon } from '@radix-ui/react-icons';

export function FloatingSyncButton() {
    const { actionQueue, isSyncing } = useData();
    const [open, setOpen] = useState(false);
    const handleClick = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <button className={styles.floatingButton} onClick={handleClick}>
                <Flex align='center' gap='2'>
                    {isSyncing ? (
                        <UpdateIcon className={styles.spinner} />
                    ) : (
                        'Sync'
                    )}
                    {actionQueue.length > 0 && (
                        <span className={styles.badge}>
                            {actionQueue.length}
                        </span>
                    )}
                </Flex>
            </button>
            <SyncQueuePanel open={open} onClose={handleClose} />
        </>
    );
}

import ActionQueue from '@/components/ActionQueue';
import { IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';

export function SyncQueuePanel({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <div className={`${styles.sidePanel} ${open ? styles.open : ''}`}>
            <div className={styles.panelHeader}>
                <h3>Sync Queue</h3>
                <IconButton variant='ghost' onClick={onClose}>
                    <Cross2Icon height='24' width='24' />
                </IconButton>
            </div>
            <div className={styles.panelContent}>
                <ActionQueue />
            </div>
        </div>
    );
}
