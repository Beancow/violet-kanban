
'use client';

import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingPage from '@/components/LoadingPage';

export default function OrganizationGate({ children }: { children: React.ReactNode }) {
    const { organizations, loading, currentOrganizationId, setCurrentOrganization } = useOrganizations();
    const router = useRouter();

    useEffect(() => {
        if (!loading && organizations.length === 0) {
            router.push('/org/create');
        }
    }, [loading, organizations, router]);

    if (loading) {
        return <LoadingPage dataType="Organizations" />;
    }

    if (organizations.length > 0 && !currentOrganizationId) {
        return (
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Select an Organization</h5>
                                <p className="card-text">Please select an organization to continue.</p>
                                <ul className="list-group">
                                    {organizations.map(org => (
                                        <li key={org.id} className="list-group-item">
                                            <button
                                                className="btn btn-link"
                                                onClick={() => setCurrentOrganization(org.id)}
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

    return <LoadingPage dataType="Organizations" />;
}
