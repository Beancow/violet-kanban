import React, { useEffect } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FloatingSyncButton } from './FloatingSyncButton';
import { useMockQueue } from '@/storybook/mocks';

function SeededFloatingSyncButton() {
    const q = useMockQueue();
    useEffect(() => {
        const existing = q.state.boardActionQueue.concat(
            q.state.listActionQueue,
            q.state.cardActionQueue
        );
        if (!existing.find((a: any) => a.payload?.tempId === 'temp-1')) {
            q.enqueueBoardAction({
                type: 'create-board',
                payload: {
                    tempId: 'temp-1',
                    data: { title: 'Board 1', organizationId: 'org-1' } as any,
                },
            } as any);
        }
        if (!existing.find((a: any) => a.payload?.tempId === 'temp-2')) {
            q.enqueueListAction({
                type: 'create-list',
                payload: {
                    tempId: 'temp-2',
                    data: {
                        title: 'List 1',
                        position: 0,
                        boardId: '',
                        organizationId: 'org-1',
                    } as any,
                },
            } as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <FloatingSyncButton />;
}

const meta: Meta<typeof FloatingSyncButton> = {
    title: 'Components/FloatingSyncButton',
    component: FloatingSyncButton,
};

export default meta;

type Story = StoryObj<typeof FloatingSyncButton>;

export const Default: Story = {
    render: () => <SeededFloatingSyncButton />,
};
