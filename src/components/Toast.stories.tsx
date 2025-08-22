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

const meta: Meta<typeof ToastRoot> = {
    title: 'Components/Toast',
    component: ToastRoot,
    tags: ['autodocs'],
    argTypes: {
        title: { control: 'text' },
        description: { control: 'text' },
        actionLabel: { control: 'text' },
    },
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
    render: (args: ToastArgs) =>
        React.createElement(
            ToastProvider,
            null,
            React.createElement(
                React.Fragment,
                null,
                React.createElement(
                    ToastRoot,
                    null,
                    React.createElement(ToastTitle, null, args.title),
                    React.createElement(
                        ToastDescription,
                        null,
                        args.description
                    ),
                    React.createElement(
                        ToastAction,
                        { asChild: true, altText: args.actionLabel },
                        React.createElement('button', null, args.actionLabel)
                    )
                ),
                React.createElement(ToastViewport, null)
            )
        ),
};
