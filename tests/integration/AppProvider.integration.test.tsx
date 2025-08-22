import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppProvider } from '../../src/providers/AppProvider';
import { useBoardStore } from '../../src/providers/BoardProvider';
import { useQueueStore } from '../../src/providers/QueueProvider';

// Use react-test-renderer to mount providers and exercise hook APIs without DOM.
describe('AppProvider integration', () => {
    it('mounts providers and updates state via hooks', () => {
        let exposed: { boardState?: any; queueState?: any } = {};

        function TestConsumer() {
            const board = useBoardStore();
            const queue = useQueueStore();

            useEffect(() => {
                board.addBoard({
                    id: 'b-int-1',
                    name: 'Integration Board',
                } as any);
                queue.enqueueCardAction({
                    type: 'create-card',
                    payload: { data: { id: 'c-int-1' } },
                    timestamp: Date.now(),
                } as any);
                exposed.boardState = board.state;
                exposed.queueState = queue.state;
            }, [board, queue]);

            return null;
        }

        act(() => {
            TestRenderer.create(
                React.createElement(
                    AppProvider,
                    null,
                    React.createElement(TestConsumer, null)
                )
            );
        });

        const boardState = exposed.boardState;
        const queueState = exposed.queueState;

        expect(boardState).toBeDefined();
        expect(Array.isArray(boardState.boards)).toBe(true);
        expect(
            boardState.boards.find((b: any) => b.id === 'b-int-1')
        ).toBeTruthy();

        expect(queueState).toBeDefined();
        expect(Array.isArray(queueState.cardActionQueue)).toBe(true);
        expect(
            queueState.cardActionQueue.find(
                (a: any) => a.payload?.data?.id === 'c-int-1'
            )
        ).toBeTruthy();
    });
});
