import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import {
    ToastProvider,
    ToastRoot,
    ToastTitle,
    ToastDescription,
    ToastViewport,
    ToastAction,
} from './Toast';
import { useMockOrganization } from '@/storybook/mocks';

const meta: Meta<typeof ToastRoot> = {
    title: 'Components/Toast',
    component: ToastRoot,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ToastRoot>;

type ToastArgs = {
    title: string;
    description: string;
    actionLabel: string;
};

export const Default: Story = {
    args: {
        title: 'Saved',
        description: 'Your changes were saved.',
        actionLabel: 'Undo',
    } as Partial<ToastArgs>,
    render: (args: any) => (
        <ToastProvider>
            <>
                <ToastRoot>
                    <ToastTitle>{args.title}</ToastTitle>
                    <ToastDescription>{args.description}</ToastDescription>
                    <ToastAction asChild altText={args.actionLabel}>
                        <button>{args.actionLabel}</button>
                    </ToastAction>
                </ToastRoot>
                <ToastViewport />
            </>
        </ToastProvider>
    ),
};
