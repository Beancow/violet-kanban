import { Dialog, Card, Avatar, Flex, Heading, Text, Button } from '@radix-ui/themes';
import type { Organization } from '@/types/appState.type';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizations: Organization[];
    onSelect: (id: string) => void;
}

export default function OrganizationSelectModal({
    open,
    onOpenChange,
    organizations,
    onSelect,
}: Props) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Title>Select an Organization</Dialog.Title>
                <Dialog.Description>
                    Choose which organization you'd like to work in.
                </Dialog.Description>
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 16 }}>
                    {organizations.map((org) => {
                        const initials = org.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();
                        return (
                            <Card key={org.id} size='3' style={{ cursor: 'pointer' }} onClick={() => onSelect(org.id)}>
                                <Flex direction='row' gap='3' align='center'>
                                    <Avatar
                                        size='3'
                                        src={org.logoURL || undefined}
                                        fallback={initials}
                                        radius='full'
                                    />
                                    <div>
                                        <Heading as='h3' size='3'>
                                            {org.name}
                                        </Heading>
                                        {org.companyWebsite && (
                                            <Text size='1' color='gray'>
                                                {org.companyWebsite}
                                            </Text>
                                        )}
                                    </div>
                                </Flex>
                            </Card>
                        );
                    })}
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant='ghost' onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </Dialog.Content>
        </Dialog.Root>
    );
}
