import { useEffect, useState } from 'react';
import { Select, Button, Flex } from '@radix-ui/themes';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { mockOrganizations } from '@/mock/mockOrganizations';

export default function OrganizationSelect({
    showCreate,
    onSelect,
    value,
    style,
}: {
    showCreate?: boolean;
    onSelect?: (orgId: string) => void;
    value?: string;
    style?: React.CSSProperties;
}) {
    const org = useOrganizationProvider();
    const organizations = org.organizations;
    const currentOrganizationId = org.currentOrganizationId;
    const setCurrentOrganizationId = org.setCurrentOrganizationId;
    const [orgs, setOrgs] = useState(organizations);
    const [selected, setSelected] = useState(
        value || currentOrganizationId || ''
    );

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true') {
            setOrgs(mockOrganizations);
        } else {
            setOrgs(organizations);
        }
    }, [organizations]);

    useEffect(() => {
        if (value) setSelected(value);
    }, [value]);

    const handleChange = (orgId: string) => {
        setSelected(orgId);
        setCurrentOrganizationId(orgId);
        if (onSelect) onSelect(orgId);
    };

    return (
        <Flex direction='row' align='center' gap='2' style={style}>
            <Select.Root value={selected} onValueChange={handleChange}>
                <Select.Trigger />
                <Select.Content>
                    {orgs.map((o: { id: string; name: string }) => (
                        <Select.Item key={o.id} value={o.id}>
                            {o.name}
                        </Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
            {showCreate && (
                <Button
                    size='1'
                    color='violet'
                    variant='soft'
                    style={{ marginLeft: 8 }}
                >
                    Create Organization
                </Button>
            )}
        </Flex>
    );
}
