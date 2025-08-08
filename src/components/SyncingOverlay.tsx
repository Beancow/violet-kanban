import { Box, Text } from '@radix-ui/themes';

export default function SyncingOverlay() {
    return (
        <Box
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}
        >
            <Text size="8" style={{ color: 'white' }}>Syncing...</Text>
        </Box>
    );
}
