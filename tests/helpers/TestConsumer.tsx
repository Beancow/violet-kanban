import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AppProvider from '../../src/providers/AppProvider';
import { useBoardStore } from '../../src/providers/BoardProvider';
import { useQueueStore } from '../../src/providers/QueueProvider';
import { useTempIdMap } from '../../src/providers/TempIdMapProvider';
import { useListStore } from '../../src/providers/ListProvider';
import { useCardStore } from '../../src/providers/CardProvider';

export type TestApi = {
    // boards
    addBoard: (b: any) => void;
    getBoards: () => any[];
    // lists
    addList: (l: any) => void;
    getLists: () => any[];
    // cards
    addCard: (c: any) => void;
    getCards: () => any[];
    // queue
    enqueueBoardAction: (a: any) => void;
    enqueueListAction: (a: any) => void;
    enqueueCardAction: (a: any) => void;
    removeBoardAction: (id: string) => void;
    removeListAction: (id: string) => void;
    removeCardAction: (id: string) => void;
    getQueue: () => any[];
    // temp id map
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    getTempMap: () => Record<string, string>;
};

// TestConsumer optionally accepts an onReady callback. If provided it will be
// called with the test API; if not, it will fall back to populating
// global.__testApi for backwards compatibility.
export function TestConsumer({
    onReady,
}: {
    onReady?: (api: TestApi) => void;
}) {
    const board = useBoardStore();
    const queue = useQueueStore();
    const tempMap = useTempIdMap();

    const api: TestApi = {
        addBoard: board.addBoard,
        getBoards: () => board.state.boards,
        addList: useListStore().addList,
        getLists: () => useListStore().state.lists,
        addCard: useCardStore().addCard,
        getCards: () => useCardStore().state.cards,
        enqueueBoardAction: queue.enqueueBoardAction,
        enqueueListAction: queue.enqueueListAction,
        enqueueCardAction: queue.enqueueCardAction,
        removeBoardAction: queue.removeBoardAction,
        removeListAction: queue.removeListAction,
        removeCardAction: queue.removeCardAction,
        getQueue: () => [
            ...queue.state.boardActionQueue,
            ...queue.state.listActionQueue,
            ...queue.state.cardActionQueue,
        ],
        setMapping: tempMap.setMapping,
        getRealId: tempMap.getRealId,
        getTempMap: () => tempMap.state,
    };

    if (typeof onReady === 'function') {
        // call immediately (tests previously set global in render body)
        onReady(api);
    } else {
        // backward compatibility
        // @ts-ignore
        (global as any).__testApi = api;
    }

    return null;
}

// Mounts AppProvider + TestConsumer and returns the test API and an unmount helper.
export function mountAppWithTestApi() {
    let api: TestApi | undefined;
    let r: any | undefined;

    act(() => {
        r = renderer.create(
            React.createElement(
                AppProvider as any,
                null,
                React.createElement(TestConsumer as any, {
                    onReady: (a: TestApi) => (api = a),
                })
            )
        );
    });

    if (!api) throw new Error('Test API not initialized');

    return {
        api,
        unmount: () => {
            if (r) act(() => r!.unmount());
        },
        renderer: r,
    };
}

export default TestConsumer;
