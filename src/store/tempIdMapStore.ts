import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TempIdMapState {
    tempIdMap: Record<string, string>; // tempId -> realId
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    clearMapping: (tempId: string) => void;
    clearAll: () => void;
}

export const useTempIdMapStore = create<TempIdMapState>()(
    persist(
        (set, get) => ({
            tempIdMap: {},
            setMapping: (tempId, realId) =>
                set((state) => ({
                    tempIdMap: { ...state.tempIdMap, [tempId]: realId },
                })),
            getRealId: (tempId) => get().tempIdMap[tempId],
            clearMapping: (tempId) =>
                set((state) => {
                    const { [tempId]: _, ...rest } = state.tempIdMap;
                    return { tempIdMap: rest };
                }),
            clearAll: () => set({ tempIdMap: {} }),
        }),
        { name: 'violet-kanban-tempidmap-storage' }
    )
);
