import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import OrganizationSelect from './OrganizationSelect';
import { useMockOrganization } from '@/storybook/mocks';

const meta: Meta<typeof OrganizationSelect> = {
    title: 'Components/OrganizationSelect',
    component: OrganizationSelect,
};

export default meta;

type Story = StoryObj<typeof OrganizationSelect>;

export const Default: Story = {
    render: () => {
        const org = useMockOrganization();
        return <OrganizationSelect showCreate onSelect={(id) => console.log('selected', id)} value={org.currentOrganizationId ?? undefined} />;
    },
};
