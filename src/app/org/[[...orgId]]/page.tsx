import OrgList from '@/components/organisation/OrgList';

export default async function OrgPage() {
    const orgId = '1'; // This should be dynamically set based on the context or route params

    return (
        <span>
            <OrgList />
        </span>
    );
}
