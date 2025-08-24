import { act } from 'react-test-renderer';
import { mountAppWithTestApi } from '../helpers/TestConsumer';

describe('AppProvider integration', () => {
    it('mounts providers and updates state via hooks', () => {
        const { api, unmount } = mountAppWithTestApi();

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

        unmount();
    });
});
