import { useState } from 'react';
import {
    Dialog,
    Button,
    Flex,
    Text,
    Select,
    TextField,
} from '@radix-ui/themes';
import { TextIcon } from '@radix-ui/react-icons';
import { Organization } from '@/types/appState.type';

const ORG_TYPES = [
    { value: 'company', label: 'Company' },
    { value: 'personal', label: 'Personal' },
    { value: 'private', label: 'Private' },
];

interface CreateOrganizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (org: Omit<Organization, 'id'>) => void;
}

export default function CreateOrganizationModal({
    open,
    onOpenChange,
    onCreate,
}: CreateOrganizationModalProps) {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [orgType, setOrgType] = useState<'company' | 'personal' | 'private'>(
        'company'
    );
    const [logoURL, setLogoURL] = useState('');

    const handleChangeOrgType = (value: string) => {
        setOrgType(value as 'company' | 'personal' | 'private');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            name,
            companyName,
            companyWebsite,
            orgType,
            logoURL,
        });
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Title>Create Organization</Dialog.Title>
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
                                    <Select.Item
                                        key={type.value}
                                        value={type.value}
                                    >
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
                        >
                            <TextField.Slot>
                                <TextIcon />
                            </TextField.Slot>
                        </TextField.Root>
                        <Button type='submit' variant='solid' color='green'>
                            Create
                        </Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}
