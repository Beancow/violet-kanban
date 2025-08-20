'use client';

import { useState } from 'react';
import { useVioletKanbanQueues } from '@/store/useVioletKanbanHooks';
import { Box, IconButton, Badge, Tooltip } from '@radix-ui/themes';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { ActionQueue } from './ActionQueue';

export function FloatingSyncButton() {
    const [open, setOpen] = useState(false);
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useVioletKanbanQueues();
    const actionQueue = [
        ...boardActionQueue,
        ...listActionQueue,
        ...cardActionQueue,
    ];

    return (
        <>
            <Box
                style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1000,
                }}
            >
                <Tooltip content='Show sync queue'>
                    <IconButton
                        size='3'
                        variant='solid'
                        color='blue'
                        onClick={() => setOpen(true)}
                        style={{ position: 'relative' }}
                    >
                        <ArrowUpIcon />
                        {actionQueue.length > 0 && (
                            <Badge
                                color='red'
                                style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    fontSize: 12,
                                    borderRadius: '50%',
                                    padding: '2px 8px',
                                }}
                            >
                                {actionQueue.length}
                            </Badge>
                        )}
                    </IconButton>
                </Tooltip>
            </Box>
            {open && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: 350,
                        height: '100%',
                        backgroundColor: 'var(--gray-2)',
                        zIndex: 1001,
                        boxShadow: '-2px 0 5px #0000001a',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'right .3s ease-in-out',
                    }}
                >
                    <Box
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid var(--gray-5)',
                            backgroundColor: 'var(--gray-3)',
                        }}
                    >
                        <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                            Sync Queue
                        </span>
                        <IconButton
                            size='2'
                            variant='ghost'
                            color='gray'
                            onClick={() => setOpen(false)}
                        >
                            ×
                        </IconButton>
                    </Box>
                    <Box
                        style={{
                            flexGrow: 1,
                            padding: '1rem',
                            overflowY: 'auto',
                        }}
                    >
                        <ActionQueue />
                    </Box>
                </Box>
            )}
        </>
    );
}
