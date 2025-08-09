'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Organization } from '@/types/appState.type';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';

export default function OrganizationPage() {
    const params = useParams();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrganization = async () => {
            if (params.orgId) {
                setLoading(true);
                const { data, success } = await fetch(`/api/orgs/${params.orgId}`).then(res => res.json());
                if (success && data) {
                    setOrganization(data);
                }
                setLoading(false);
            }
        };
        fetchOrganization();
    }, [params.orgId]);

    const handleUpdateOrganization = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!organization) return;

        const formData = new FormData(event.currentTarget);
        const result = await fetch(`/api/orgs/${organization.id}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ formData: Object.fromEntries(formData.entries()) }),
        }).then(res => res.json());

        if (result.success) {
            alert('Organization updated successfully!');
        } else {
            alert(`Error updating organization: ${result.error?.message}`);
        }
    };

    const handleDeleteOrganization = async () => {
        if (!organization || !confirm('Are you sure you want to delete this organization?')) return;

        const result = await fetch(`/api/orgs/${organization.id}/delete`, {
            method: 'POST',
        }).then(res => res.json());

        if (result.success) {
            alert('Organization deleted successfully!');
            // Redirect or update UI as needed
        } else {
            alert(`Error deleting organization: ${result.error?.message}`);
        }
    };

    if (loading) {
        return <Text>Loading organization...</Text>;
    }

    if (!organization) {
        return <Text>Organization not found</Text>;
    }

    return (
        <Box>
            <Text>Organization: {organization.name}</Text>
            <form onSubmit={handleUpdateOrganization}>
                <Flex direction="column" gap="2">
                    <TextField.Root
                        placeholder="Organization Name"
                        defaultValue={organization.name}
                        name="name"
                        required
                    />
                    {/* Add other fields for update as needed */}
                    <Button type="submit">Update Organization</Button>
                </Flex>
            </form>
            <Button color="red" onClick={handleDeleteOrganization} mt="3">
                Delete Organization
            </Button>
        </Box>
    );
}