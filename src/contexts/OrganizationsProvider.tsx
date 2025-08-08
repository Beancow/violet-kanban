'use client';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { Organization } from '@/types/appState.type';
import { getOrganizationsForUserServerAction } from '@/lib/firebase/orgServerActions';
import { useAuth } from '@/contexts/AuthProvider';

interface OrganizationsContextType {
    organizations: Organization[];
    loading: boolean;
}

const OrganizationsContext = createContext<OrganizationsContextType>({
    organizations: [],
    loading: true,
});

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const { authUser } = useAuth();

    useEffect(() => {
        const fetchOrgs = async () => {
            if (authUser) {
                setLoading(true); // Set loading to true before fetching
                const { data, success } = await getOrganizationsForUserServerAction(
                    authUser.uid
                );
                if (success && data) {
                    setOrganizations(data);
                }
                setLoading(false); // Set loading to false after fetching (success or failure)
            } else {
                setOrganizations([]); // Clear organizations if no authUser
                setLoading(false); // Set loading to false if no authUser
            }
        };
        fetchOrgs();
    }, [authUser]);

    return (
        <OrganizationsContext.Provider value={{ organizations, loading }}>
            {children}
        </OrganizationsContext.Provider>
    );
}

export const useOrganizations = () => {
    return useContext(OrganizationsContext);
};
