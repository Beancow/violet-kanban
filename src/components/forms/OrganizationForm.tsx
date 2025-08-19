import { useState, useEffect } from 'react';
import { Flex, Text, Select, TextField, Button } from '@radix-ui/themes';
import type { Organization } from '@/types/appState.type';

const ORG_TYPES = [
    { value: 'company', label: 'Company' },
    { value: 'personal', label: 'Personal' },
    { value: 'private', label: 'Private' },
];

interface OrganizationFormProps {
    organization?: Organization;
    isEdit?: boolean;
    onSubmit: (orgData: any) => void;
}

export default function OrganizationForm({
    organization,
    isEdit = false,
    onSubmit,
}: OrganizationFormProps) {
    const [name, setName] = useState(organization?.name ?? '');
    const [companyName, setCompanyName] = useState(
        organization?.companyName ?? ''
    );
    const [companyWebsite, setCompanyWebsite] = useState(
        organization?.companyWebsite ?? ''
    );
    const [orgType, setOrgType] = useState(organization?.orgType ?? 'company');
    const [logoURL, setLogoURL] = useState(organization?.logoURL ?? '');

    useEffect(() => {
        if (organization) {
            setName(organization.name ?? '');
            setCompanyName(organization.companyName ?? '');
            setCompanyWebsite(organization.companyWebsite ?? '');
            setOrgType(organization.orgType ?? 'company');
            setLogoURL(organization.logoURL ?? '');
        }
    }, [organization]);

    const handleChangeOrgType = (value: string) => {
        setOrgType(value as 'company' | 'personal' | 'private');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...organization,
            name,
            companyName,
            companyWebsite,
            orgType,
            logoURL,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction='column' gap='3'>
                <Text as='label' size='2' mb='1'>
                    Organization Name
                </Text>
                <TextField.Root
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder='Organization Name'
                />
                <Text as='label' size='2' mb='1'>
                    Company Name
                </Text>
                <TextField.Root
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder='Company Name'
                />
                <Text as='label' size='2' mb='1'>
                    Company Website
                </Text>
                <TextField.Root
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder='Company Website'
                />
                <Text as='label' size='2' mb='1'>
                    Organization Type
                </Text>
                <Select.Root
                    value={orgType}
                    onValueChange={handleChangeOrgType}
                >
                    <Select.Trigger />
                    <Select.Content>
                        {ORG_TYPES.map((type) => (
                            <Select.Item key={type.value} value={type.value}>
                                {type.label}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
                <Text as='label' size='2' mb='1'>
                    Logo URL
                </Text>
                <TextField.Root
                    value={logoURL}
                    onChange={(e) => setLogoURL(e.target.value)}
                    placeholder='Logo URL'
                />
                <Button type='submit' variant='solid' color='green'>
                    {isEdit ? 'Save Changes' : 'Create'}
                </Button>
            </Flex>
        </form>
    );
}
