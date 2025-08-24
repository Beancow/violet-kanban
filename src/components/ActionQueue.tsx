import { useEffect, useState, useMemo } from 'react';
import {
    useVioletKanbanQueues,
    useVioletKanbanData,
} from '@/providers/useVioletKanbanHooks';
import { useQueues } from '@/providers/QueueProvider';
import { getActionItemId, detectActionConflicts } from '@/providers/helpers';
import { Box, Text } from '@radix-ui/themes';
import styles from './ActionQueue.module.css';
import { SyncAction } from '@/types/worker.type';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';
import type { VioletKanbanAction } from '@/types/violet-kanban-action';

export function ActionQueue() {
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useVioletKanbanQueues();
    const { boards, lists, cards } = useVioletKanbanData();
    const actionQueue = useMemo(
        () => [...boardActionQueue, ...listActionQueue, ...cardActionQueue],
        [boardActionQueue, listActionQueue, cardActionQueue]
    );
    const { removeBoardAction, removeListAction, removeCardAction } =
        useQueues();
    const [conflicts, setConflicts] = useState<
        {
            id: string;
            local: Board | BoardList | BoardCard;
            server: Board | BoardList | BoardCard;
            action: VioletKanbanAction;
            type: 'board' | 'list' | 'card';
        }[]
    >([]);

    // Use helper functions for conflict detection
    useEffect(() => {
        setConflicts(detectActionConflicts(actionQueue, boards, lists, cards));
    }, [actionQueue, boards, lists, cards]);

    if (actionQueue.length === 0) {
        return <Text>No pending actions.</Text>;
    }

    const getItemName = (action: VioletKanbanAction) => {
        switch (action.type) {
            case 'create-board':
            case 'update-board':
                return (
                    boards.find((b) => b.id === getActionItemId(action))
                        ?.title || 'Board'
                );
            case 'delete-board':
            case 'move-board':
                return (
                    boards.find((b) => b.id === getActionItemId(action))
                        ?.title || 'Board'
                );
            case 'create-list':
            case 'update-list':
                return (
                    lists.find((l) => l.id === getActionItemId(action))
                        ?.title || 'List'
                );
            case 'delete-list':
            case 'move-list':
                return (
                    lists.find((l) => l.id === getActionItemId(action))
                        ?.title || 'List'
                );
            case 'create-card':
            case 'update-card':
                return (
                    cards.find((c) => c.id === getActionItemId(action))
                        ?.title || 'Card'
                );
            case 'delete-card':
            case 'soft-delete-card':
            case 'restore-card':
            case 'move-card':
                return (
                    cards.find((c) => c.id === getActionItemId(action))
                        ?.title || 'Card'
                );
            case 'create-organization':
                return action.payload.name || 'Organization';
            case 'update-organization':
                return action.payload.data.name || 'Organization';
            case 'delete-organization':
                return 'Organization';
            case 'fetch-org-data':
                return 'Fetch Org Data';
            case 'sync-complete':
                return 'Sync Complete';
            case 'error':
                return 'Error';
            default: {
                return 'Unknown Action';
            }
        }
    };

    return (
        <Box className={styles.queueContainer}>
            {conflicts.length > 0 && (
                <Box className={styles.conflictContainer}>
                    <Text weight='bold' color='red'>
                        Data conflict detected!
                    </Text>
                    <ul>
                        {conflicts.map(
                            ({ id, local, server, action, type }) => (
                                <li key={id} className={styles.conflictItem}>
                                    <Text>
                                        {type.charAt(0).toUpperCase() +
                                            type.slice(1)}{' '}
                                        <b>{getItemName(action)}</b> has
                                        conflicting changes:
                                    </Text>
                                    <Box>
                                        <Text size='1'>
                                            <b>Local update:</b>{' '}
                                            {String(local.updatedAt)} (queued at{' '}
                                            {action.timestamp}
                                            )<br />
                                            <b>Server update:</b>{' '}
                                            {String(server.updatedAt)}
                                        </Text>
                                        <Box mt='2'>
                                            <button
                                                onClick={() => {
                                                    setConflicts((prev) =>
                                                        prev.filter(
                                                            (c) => c.id !== id
                                                        )
                                                    );
                                                    // Keep local: remove conflict from queue
                                                    if (type === 'board')
                                                        removeBoardAction(id);
                                                    if (type === 'list')
                                                        removeListAction(id);
                                                    if (type === 'card')
                                                        removeCardAction(id);
                                                }}
                                            >
                                                Keep Local
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConflicts((prev) =>
                                                        prev.filter(
                                                            (c) => c.id !== id
                                                        )
                                                    );
                                                    // Keep server: remove local change from queue
                                                    if (type === 'board')
                                                        removeBoardAction(id);
                                                    if (type === 'list')
                                                        removeListAction(id);
                                                    if (type === 'card')
                                                        removeCardAction(id);
                                                }}
                                                style={{ marginLeft: 8 }}
                                            >
                                                Keep Server
                                            </button>
                                        </Box>
                                    </Box>
                                </li>
                            )
                        )}
                    </ul>
                </Box>
            )}
            <ul className={styles.queueList}>
                {actionQueue.map((action) => (
                    <li key={action.timestamp} className={styles.queueItem}>
                        <Box>
                            <Text weight='bold'>{getItemName(action)}</Text>
                            <Text size='1' color='gray' as='p'>
                                {action.type}
                            </Text>
                        </Box>
                        <Text size='1' color='gray'>
                            {action.timestamp}
                        </Text>
                    </li>
                ))}
            </ul>
        </Box>
    );
}
