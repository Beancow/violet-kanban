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
}

const OrganizationsContext = createContext<OrganizationsContextType>({
    organizations: [],
    loading: true,
    currentOrganizationId: null,
    currentOrganization: null,
    setCurrentOrganization: () => {},
});

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(
        () => {
            const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
            return storedOrgId;
        }
    );
    const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
    const { authUser } = useAuth();

    const setCurrentOrganization = useCallback((organizationId: string) => {
        
        localStorage.setItem('currentOrganizationId', organizationId);
        setCurrentOrganizationId(organizationId);
    }, []);

    useEffect(() => {
        const org = organizations.find(o => o.id === currentOrganizationId);
        setCurrentOrganizationState(org || null);
    }, [currentOrganizationId, organizations]);

    useEffect(() => {
        const fetchOrgs = async () => {
            if (authUser) {
                setLoading(true); // Set loading to true before fetching
                    const { data, success } = await getOrganizationsForUserServerAction(
                    authUser.uid
                );
                    if (success && data) {
                    setOrganizations(data);
                    // Set current organization if none is set or if the current one is no longer valid
                    if (!currentOrganizationId || !data.some(org => org.id === currentOrganizationId)) {
                        // Do not automatically set currentOrganizationId here.
                        // The useRequireOrganization hook will handle redirection if needed.
                    } else {
                        const org = data.find(o => o.id === currentOrganizationId);
                        setCurrentOrganizationState(org || null);
                    }
                }
                setLoading(false); // Set loading to false after fetching (success or failure)
            } else {
                    setOrganizations([]); // Clear organizations if no authUser
                setLoading(false); // Set loading to false if no authUser
            }
        };
        fetchOrgs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser]);

    return (
        <OrganizationsContext.Provider
            value={{
                organizations,
                loading,
                currentOrganizationId,
                currentOrganization,
                setCurrentOrganization,
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
