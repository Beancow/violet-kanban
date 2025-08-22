'use client';

import React from 'react';
import { useUiStore } from '@/store/uiStore';
import CreateBoardModal from '@/components/modals/CreateBoardModal';
import CreateOrganizationModal from '@/components/modals/CreateOrEditOrganizationModal';
import { CreateCardModal } from '@/components/modals/CreateCardModal';
import { CreateListModal } from '@/components/modals/CreateListModal';

type ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    [key: string]: unknown;
};

// Registry of modals. Components should accept `open` and `onOpenChange`.
const registry: Record<string, React.ComponentType<ModalProps>> = {
    'create-board':
        CreateBoardModal as unknown as React.ComponentType<ModalProps>,
    'create-organization':
        CreateOrganizationModal as unknown as React.ComponentType<ModalProps>,
    'create-card':
        CreateCardModal as unknown as React.ComponentType<ModalProps>,
    'create-list':
        CreateListModal as unknown as React.ComponentType<ModalProps>,
};

export default function ModalProvider() {
    const { openModal, close } = useUiStore((s) => ({
        openModal: s.openModal,
        close: s.close,
    }));

    if (!openModal.name) return null;

    const Component = registry[openModal.name];
    if (!Component) return null;

    const props = (openModal.props ?? {}) as Record<string, unknown>;

    return (
        <Component
            open={true}
            onOpenChange={(open: boolean) => {
                if (!open) close();
            }}
            {...props}
        />
    );
}
