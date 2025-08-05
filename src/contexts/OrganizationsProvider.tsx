'use client';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { Organization, OrganizationMember } from '@/types/appState.type';
import { getOrganizationsForUserAction } from '@/lib/firebase/orgServerActions';
import { useAuth } from '@/contexts/AuthProvider';

interface OrganizationsContextType {
    organizations: Organization[];
    loading: boolean;
    addMember: (orgId: string, member: OrganizationMember) => void;
}

const OrganizationsContext = createContext<OrganizationsContextType>({
    organizations: [],
    loading: true,
    addMember: () => {},
});

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const { authUser } = useAuth();

    useEffect(() => {
        const fetchOrgs = async () => {
            if (authUser) {
                const { data, success } = await getOrganizationsForUserAction(authUser.uid);
                if (success && data) {
                    setOrganizations(data);
                }
                setLoading(false);
            }
        };
        fetchOrgs();
    }, [authUser]);

    const addMember = (orgId: string, member: OrganizationMember) => {
        setOrganizations((prevOrgs) => {
            return prevOrgs.map((org) => {
                if (org.id === orgId) {
                    return { ...org, members: [...org.members, member] };
                }
                return org;
            });
        });
    };

    return (
        <OrganizationsContext.Provider
            value={{ organizations, loading, addMember }}
        >
            {children}
        </OrganizationsContext.Provider>
    );
}

export const useOrganizations = () => {
    return useContext(OrganizationsContext);
};
