'use client';

import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingPage from '@/components/LoadingPage';

export default function OrganizationGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const org = useOrganizationProvider();
    const organizations = org.organizations;
    const loading = org.loading;
    const currentOrganizationId = org.currentOrganizationId;
    const setCurrentOrganizationId = org.setCurrentOrganizationId;
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(
            typeof window !== 'undefined' ? window.navigator.onLine : true
        );
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!loading && organizations.length === 0 && isOnline) {
            router.push('/org/create');
        }
    }, [loading, organizations, router, isOnline]);

    if (loading) {
        return <LoadingPage dataType='Organizations' />;
    }

    if (!isOnline && organizations.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>You are offline</h2>
                <p>
                    You have no organizations and are currently offline.
                    <br />
                    Organization creation is not possible while offline.
                </p>
            </div>
        );
    }

    if (organizations.length > 0 && !currentOrganizationId) {
        return (
            <div className='container mt-5'>
                <div className='row justify-content-center'>
                    <div className='col-md-6'>
                        <div className='card'>
                            <div className='card-body'>
                                <h5 className='card-title'>
                                    Select an Organization
                                </h5>
                                <p className='card-text'>
                                    Please select an organization to continue.
                                </p>
                                <ul className='list-group'>
                                    {organizations.map((org) => (
                                        <li
                                            key={org.id}
                                            className='list-group-item'
                                        >
                                            <button
                                                className='btn btn-link'
                                                onClick={() =>
                                                    setCurrentOrganizationId(
                                                        org.id
                                                    )
                                                }
                                            >
                                                {org.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentOrganizationId) {
        return <>{children}</>;
    }

    return <LoadingPage dataType='Organizations' />;
}
