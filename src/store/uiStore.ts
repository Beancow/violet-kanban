import { create } from 'zustand';
import type { StateCreator } from 'zustand';

type OpenModal = {
    name: string | null;
    props?: Record<string, unknown> | null;
};

type UiStore = {
    openModal: OpenModal;
    open: (name: string, props?: Record<string, unknown>) => void;
    close: () => void;
    toggle: (name: string, props?: Record<string, unknown>) => void;
};

const creator: StateCreator<UiStore> = (set, get) => ({
    openModal: { name: null, props: null },
    open: (name: string, props?: Record<string, unknown>) =>
        set(() => ({ openModal: { name, props: props ?? null } })),
    close: () => set(() => ({ openModal: { name: null, props: null } })),
    toggle: (name: string, props?: Record<string, unknown>) => {
        const current = get().openModal.name;
        if (current === name) {
            set(() => ({ openModal: { name: null, props: null } }));
        } else {
            set(() => ({ openModal: { name, props: props ?? null } }));
        }
    },
});

export const useUiStore = create<UiStore>(creator);

export default useUiStore;
