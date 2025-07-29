import { Button } from '@radix-ui/themes';
import Link from 'next/link';
import { useAppState } from '@/components/AppStateProvider';

export default async function OrgList() {
    const { organizations } = useAppState();

    return (
        <span>
            {organizations.map((org) => (
                <div key={org.id}>
                    <h2>{org.name}</h2>
                    <p>{org.type}</p>
                    <p>{'Current: ' + org.updatedAt}</p>
                </div>
            ))}
            <Button variant='solid' size='2' color='blue'>
                <Link href='/createOrg'>Create New Organization</Link>
            </Button>
        </span>
    );
}
