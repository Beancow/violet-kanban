'use client';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { Organization } from '@/types/appState.type';
import { getOrganizationsForUserServerAction } from '@/lib/firebase/orgServerActions';
import { useAuth } from '@/contexts/AuthProvider';

interface OrganizationsContextType {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganization: (organizationId: string) => void;
    refetchOrganizations: () => Promise<void>;
}

const OrganizationsContext = createContext<OrganizationsContextType>({
    organizations: [],
    loading: true,
    currentOrganizationId: null,
    currentOrganization: null,
    setCurrentOrganization: () => {},
    refetchOrganizations: async () => {},
});

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(
        () => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('currentOrganizationId');
            }
            return null;
        }
    );
    const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
    const { authUser } = useAuth();

    const fetchOrgs = useCallback(async () => {
        if (authUser) {
            setLoading(true);
            const { data, success } = await getOrganizationsForUserServerAction(
                authUser.uid
            );
            if (success && data) {
                setOrganizations(data);
                if (!currentOrganizationId || !data.some(org => org.id === currentOrganizationId)) {
                    // No-op, useRequireOrganization will handle redirection if needed.
                } else {
                    const org = data.find(o => o.id === currentOrganizationId);
                    setCurrentOrganizationState(org || null);
                }
            }
            setLoading(false);
        } else {
            setOrganizations([]);
            setLoading(false);
        }
    }, [authUser, currentOrganizationId]);

    const setCurrentOrganization = useCallback((organizationId: string) => {
        localStorage.setItem('currentOrganizationId', organizationId);
        setCurrentOrganizationId(organizationId);
    }, []);

    useEffect(() => {
        const org = organizations.find(o => o.id === currentOrganizationId);
        setCurrentOrganizationState(org || null);
    }, [currentOrganizationId, organizations]);

    useEffect(() => {
        fetchOrgs();
    }, [authUser, fetchOrgs]);

    return (
        <OrganizationsContext.Provider
            value={{
                organizations,
                loading,
                currentOrganizationId,
                currentOrganization,
                setCurrentOrganization,
                refetchOrganizations: fetchOrgs,
            }}
        >
            {children}
        </OrganizationsContext.Provider>
    );
}

export const useOrganizations = () => {
    const context = useContext(OrganizationsContext);
    if (context === undefined) {
        throw new Error('useOrganizations must be used within an OrganizationsProvider');
    }
    return context;
};