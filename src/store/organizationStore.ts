import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/types/appState.type';
import { isUseBoundStore } from './factoryHelpers';

interface OrganizationState {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganizationId: (id: string | null) => void;
    setOrganizations: (orgs: Organization[]) => void;
    setLoading: (loading: boolean) => void;
    refetchOrganizations: () => Promise<void>;
}

export function createOrganizationStore(
    persistEnabled = true
): import('zustand').StoreApi<OrganizationState> {
    throw new Error('STORE_DISABLED: createOrganizationStore is disabled during migration checks');
}

let _organizationStore: StoreApi<OrganizationState> | null = null;

export function initializeOrganizationStore(
    persistEnabled = typeof window !== 'undefined'
) {
    throw new Error('STORE_DISABLED: initializeOrganizationStore is disabled during migration checks');
}

export function getOrganizationStoreIfReady(): StoreApi<OrganizationState> | null {
    throw new Error('STORE_DISABLED: getOrganizationStoreIfReady is disabled during migration checks');
}

export function getOrCreateOrganizationStore(): StoreApi<OrganizationState> {
    throw new Error('STORE_DISABLED: getOrCreateOrganizationStore is disabled during migration checks');
}

export function createOrganizationStoreForTest() {
    throw new Error('STORE_DISABLED: createOrganizationStoreForTest is disabled during migration checks');
}

// Lazy UseBoundStore wrapper for components. Mirrors the pattern used by other stores so
// non-React code can call `getOrCreateOrganizationStore()` and React components can call `useOrganizationStore`.
export const useOrganizationStore: import('zustand').UseBoundStore<
    StoreApi<OrganizationState>
    throw new Error('STORE_DISABLED: useOrganizationStore is disabled during migration checks');
