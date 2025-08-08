import { useSync } from '@/contexts/SyncProvider';
import { Box, Text } from '@radix-ui/themes';

export default function ActionQueue() {
    const { actionQueue } = useSync();

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                backgroundColor: '#f0f0f0',
                padding: '1rem',
                borderTop: '1px solid #ccc',
            }}
        >
            <Text size="4">Pending Actions:</Text>
            <ul>
                {actionQueue.map((action, index) => (
                    <li key={index}>{JSON.stringify(action)}</li>
                ))}
            </ul>
        </Box>
    );
}
