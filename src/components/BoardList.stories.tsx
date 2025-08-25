import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BoardListComponent } from './BoardList';
import { useMockOrganization } from '@/storybook/mocks';

const meta: Meta<typeof BoardListComponent> = {
    title: 'Components/BoardList',
    component: BoardListComponent,
    argTypes: {
        title: { control: 'text' },
        cards: { control: 'object' },
    },
};

export default meta;

type Story = StoryObj<typeof BoardListComponent>;

export const Default: Story = {
    args: {
        title: 'To Do',
        cards: [
            { id: 'c1', title: 'Write tests' },
            { id: 'c2', title: 'Implement provider' },
            { id: 'c3', title: 'Refactor stores' },
        ],
    },
    render: (args) => {
        useMockOrganization();
        return <BoardListComponent {...(args as any)} />;
    },
};
