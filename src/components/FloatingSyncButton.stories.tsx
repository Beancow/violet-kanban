import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FloatingSyncButton } from './FloatingSyncButton';
import { useMockQueue } from '@/storybook/mocks';

const meta: Meta<typeof FloatingSyncButton> = {
    title: 'Components/FloatingSyncButton',
    component: FloatingSyncButton,
};

export default meta;

type Story = StoryObj<typeof FloatingSyncButton>;

export const Default: Story = {
    render: () => {
        // populate mock queue for the story
        const q = useMockQueue();
        // seed a couple of actions
        q.enqueueBoardAction({ type: 'create-board', payload: { tempId: 'temp-1', data: { name: 'Board 1' } } });
        q.enqueueListAction({ type: 'create-list', payload: { tempId: 'temp-2', data: { name: 'List 1' } } });
        return <FloatingSyncButton />;
    },
};
