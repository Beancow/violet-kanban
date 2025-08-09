import { useSync } from '@/contexts/SyncProvider';
import { useBoardData } from '@/contexts/BoardDataProvider';
import { Box, Text } from '@radix-ui/themes';
import styles from './ActionQueue.module.css';
import { Action } from '@/types/sync.type';

export default function ActionQueue() {
    const { actionQueue } = useSync();
    const { boards, cards } = useBoardData();

    if (actionQueue.length === 0) {
        return <Text>No pending actions.</Text>;
    }

    const getItemName = (action: Action) => {
        const { payload, type } = action;
        console.log('Getting item name for action:', action);

        // Handle create actions first, as the item won't be in the main data arrays yet.
        if (type === 'create-board' && payload.title) {
            return payload.title;
        }
        if (type === 'addCard' && payload.newCard?.title) {
            return payload.newCard.title;
        }

        // For update/delete, find the item in the existing data.
        if (type.includes('Board')) {
            const board = boards.find(b => b.id === payload.boardId);
            return board?.title || 'Board';
        }
        if (type.includes('Card')) {
            const card = cards.find(c => c.id === payload.cardId);
            return card?.title || 'Card';
        }
        return type;
    };

    return (
        <Box className={styles.queueContainer}>
            <ul className={styles.queueList}>
                {actionQueue.map((action) => (
                    <li key={action.timestamp} className={styles.queueItem}>
                        <Box>
                            <Text weight="bold">{getItemName(action)}</Text>
                            <Text size="1" color="gray" as="p">{action.type}</Text>
                        </Box>
                        <Text size="1" color="gray">
                            {new Date(action.timestamp).toLocaleString()}
                        </Text>
                    </li>
                ))}
            </ul>
        </Box>
    );
}