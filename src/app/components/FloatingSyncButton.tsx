'use client';
import { useState } from 'react';
import { useSync } from '@/contexts/SyncProvider';
import ActionQueue from '@/components/ActionQueue';
import styles from './FloatingSyncButton.module.css';
import { Button, IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';

export default function FloatingSyncButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { actionQueue, processActionQueue } = useSync();

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <div>
            <button className={styles.floatingButton} onClick={togglePanel}>
                Sync
                {actionQueue.length > 0 && (
                    <span className={styles.badge}>{actionQueue.length}</span>
                )}
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
                    <Button onClick={processActionQueue} disabled={actionQueue.length === 0} style={{ width: '100%', marginTop: '1rem' }}>
                        Sync Now
                    </Button>
                </div>
            </div>
        </div>
    );
}