'use client';

import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingPage from '@/components/LoadingPage';
import OrganizationSelectModal from '@/components/modals/OrganizationSelectModal';

export default function OrganizationGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const org = useOrganizationProvider();
    const organizations = org.organizations;
    const loading = org.loading;
    const currentOrganizationId = org.currentOrganizationId;
    const isHydrated = (org as any).isHydrated as boolean | undefined;
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

    // If provider hasn't hydrated local selection yet, show a loading state to avoid flicker.
    if (!isHydrated) {
        return <LoadingPage dataType='Organizations' />;
    }

    const refetchError = (org as any).refetchError as string | null | undefined;
    const refetchOrganizations = org.refetchOrganizations;
    const clearRefetchError = (org as any).clearRefetchError as
        | (() => void)
        | undefined;

    if (refetchError) {
        return (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>Failed to load organizations</h2>
                <p>{refetchError}</p>
                <div>
                    <button
                        className='btn btn-primary'
                        onClick={async () => {
                            if (clearRefetchError) clearRefetchError();
                            try {
                                await refetchOrganizations();
                            } catch (_) {
                                // refetchOrganizations sets the error state
                            }
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

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

    const [selectOpen, setSelectOpen] = useState(false);

    if (organizations.length > 0 && !currentOrganizationId) {
        // Open the organization select modal immediately when provider
        // has organizations but no current selection.
        // Note: using state to render the modal so we can keep it controlled.
        return (
            <>
                <OrganizationSelectModal
                    open={true}
                    onOpenChange={(v) => setSelectOpen(v)}
                    organizations={organizations}
                    onSelect={(id) => {
                        setCurrentOrganizationId(id);
                    }}
                />
                <LoadingPage dataType='Organizations' />
            </>
        );
    }

    if (currentOrganizationId) {
        return <>{children}</>;
    }

    return <LoadingPage dataType='Organizations' />;
}
