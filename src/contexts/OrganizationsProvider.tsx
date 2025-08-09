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
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from './AuthProvider';
import { getOrganizationsForUserServerAction } from '@/lib/firebase/orgServerActions';

interface OrganizationsContextType {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganization: (organizationId: string | null) => void;
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
    const [organizations, setOrganizations] = useLocalStorage<Organization[]>('organizations', []);
    const [loading, setLoading] = useState(true);
    const [currentOrganizationId, setCurrentOrganizationId] = useLocalStorage<string | null>('currentOrganizationId', null);
    const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
    const { authUser } = useAuth();

    const fetchOrgs = useCallback(async () => {
        if (authUser) {
            setLoading(true);
            const { data, success } = await getOrganizationsForUserServerAction(authUser.uid);
            if (success && data) {
                setOrganizations(data);
            }
            setLoading(false);
        }
    }, [authUser, setOrganizations]);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    useEffect(() => {
        const org = organizations.find(o => o.id === currentOrganizationId);
        setCurrentOrganizationState(org || null);
    }, [currentOrganizationId, organizations]);

    return (
        <OrganizationsContext.Provider
            value={{
                organizations,
                loading,
                currentOrganizationId,
                currentOrganization,
                setCurrentOrganization: setCurrentOrganizationId,
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