import { act } from 'react';
import { createReducerHarness } from '../helpers/reducerHarness';

describe('AppProvider integration', () => {
    it('mounts providers and updates state via hooks', () => {
        const api = createReducerHarness();

        act(() => {
            api.addBoard({ id: 'b-int-1', name: 'Integration Board' } as any);
            api.enqueueCardAction({
                type: 'create-card',
                payload: { data: { id: 'c-int-1' } },
                timestamp: Date.now(),
            } as any);
        });

        const boardState = api.getBoards();
        const queueState = api.getQueue();

        expect(boardState).toBeDefined();
        expect(Array.isArray(boardState)).toBe(true);
        expect(boardState.find((b: any) => b.id === 'b-int-1')).toBeTruthy();

        expect(queueState).toBeDefined();
        expect(Array.isArray(queueState)).toBe(true);
        expect(
            queueState.find((a: any) => a.payload?.data?.id === 'c-int-1')
        ).toBeTruthy();

        // no unmount step needed for reducer harness
    });
});
