import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { UiApi } from '@/types/provider-apis';

type OpenModal = UiApi['openModal'];

const UiContext = createContext<UiApi | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
    const [openModal, setOpenModal] = useState<OpenModal>({
        name: null,
        props: null,
    });

    const api: UiApi = {
        openModal,
        open: (name: string, props?: Record<string, unknown>) =>
            setOpenModal({ name, props: props ?? null }),
        close: () => setOpenModal({ name: null, props: null }),
        toggle: (name: string, props?: Record<string, unknown>) =>
            setOpenModal((s) =>
                s.name === name
                    ? { name: null, props: null }
                    : { name, props: props ?? null }
            ),
    };

    return <UiContext.Provider value={api}>{children}</UiContext.Provider>;
}

export function useUi() {
    const ctx = useContext(UiContext);
    if (!ctx) throw new Error('useUi must be used within UiProvider');
    return ctx;
}

export default useUi;
