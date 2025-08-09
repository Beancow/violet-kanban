'use client';
import { useState } from 'react';
import { useData } from '@/contexts/DataProvider';
import ActionQueue from '@/components/ActionQueue';
import styles from './FloatingSyncButton.module.css';
import { IconButton, Flex } from '@radix-ui/themes';
import { Cross2Icon, UpdateIcon } from '@radix-ui/react-icons';

export default function FloatingSyncButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { actionQueue, isSyncing } = useData();

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <div>
            <button className={styles.floatingButton} onClick={togglePanel}>
                <Flex align="center" gap="2">
                    {isSyncing ? (
                        <UpdateIcon className={styles.spinner} />
                    ) : (
                        'Sync'
                    )}
                    {actionQueue.length > 0 && (
                        <span className={styles.badge}>{actionQueue.length}</span>
                    )}
                </Flex>
            </button>

            <div className={`${styles.sidePanel} ${isOpen ? styles.open : ''}`}>
                <div className={styles.panelHeader}>
                    <h3>Sync Queue</h3>
                    <IconButton variant="ghost" onClick={togglePanel}>
                        <Cross2Icon height="24" width="24" />
                    </IconButton>
                </div>
                <div className={styles.panelContent}>
                    <ActionQueue />
                </div>
            </div>
        </div>
    );
}