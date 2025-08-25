import React, { useEffect } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FloatingSyncButton } from './FloatingSyncButton';

const meta: Meta<typeof FloatingSyncButton> = {
    title: 'Components/FloatingSyncButton',
    component: FloatingSyncButton,
};

export default meta;

type Story = StoryObj<typeof FloatingSyncButton>;

export const Default: Story = {
    render: () => <FloatingSyncButton />,
};
