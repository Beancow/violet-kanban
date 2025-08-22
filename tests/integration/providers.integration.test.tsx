import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AppProvider from '../../src/providers/AppProvider';
import TestConsumer from '../helpers/TestConsumer';

describe('Providers integration', () => {
    beforeEach(() => {
        // clear any attached test API
        // @ts-ignore
        delete (global as any).__testApi;
    });

    test('create board -> enqueue action -> reconcile temp id', () => {
        act(() => {
            renderer.create(
                React.createElement(
                    AppProvider,
                    null,
                    React.createElement(TestConsumer)
                )
            );
        });

        // create a temporary board (no id, only tempId)
        const tempId = 'temp-board-1';
        const boardObj = {
            id: undefined,
            tempId,
            name: 'Temp Board',
        } as any;

        act(() => {
            // add board to board store
            // @ts-ignore
            (global as any).__testApi.addBoard(boardObj);

            // enqueue a create action for the board
            const createAction = {
                type: 'BOARD_CREATE',
                payload: { data: { ...boardObj } },
            } as any;
            // @ts-ignore
            (global as any).__testApi.enqueueBoardAction(createAction);
        });

        // verify board present in boards
        // @ts-ignore
        let boards = (global as any).__testApi.getBoards();
        expect(Array.isArray(boards)).toBe(true);
        expect(boards.find((b: any) => b.tempId === tempId)).toBeTruthy();

        // verify queue has one action
        // @ts-ignore
        let queue = (global as any).__testApi.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0].type).toBe('BOARD_CREATE');

        // simulate server response: assign real id
        const realId = 'board-123';
        act(() => {
            // set mapping from temp to real
            // @ts-ignore
            (global as any).__testApi.setMapping(tempId, realId);
            // remove queued action by temp id (queue reconciler in app would do this)
            // @ts-ignore
            (global as any).__testApi.removeBoardAction(tempId);
        });

        // temp map should contain mapping
        // @ts-ignore
        const mapping = (global as any).__testApi.getTempMap();
        expect(mapping[tempId]).toBe(realId);

        // queue should be empty now
        // @ts-ignore
        queue = (global as any).__testApi.getQueue();
        expect(queue.length).toBe(0);
    });

    test('create list and card -> enqueue actions -> reconcile temp ids across providers', () => {
        act(() => {
            renderer.create(
                React.createElement(
                    AppProvider,
                    null,
                    React.createElement(TestConsumer)
                )
            );
        });

        // create temp list and temp card
        const listTempId = 'temp-list-1';
        const cardTempId = 'temp-card-1';
        const listObj = {
            id: undefined,
            tempId: listTempId,
            name: 'Temp List',
        } as any;
        const cardObj = {
            id: undefined,
            tempId: cardTempId,
            title: 'Temp Card',
            listId: listTempId,
        } as any;

        act(() => {
            // add list and card
            // @ts-ignore
            (global as any).__testApi.addList?.(listObj);
            // @ts-ignore
            (global as any).__testApi.addCard?.(cardObj);

            // enqueue list create and card create
            const listCreate = {
                type: 'LIST_CREATE',
                payload: { data: { ...listObj } },
            } as any;
            const cardCreate = {
                type: 'CARD_CREATE',
                payload: { data: { ...cardObj } },
            } as any;
            // @ts-ignore
            (global as any).__testApi.enqueueListAction?.(listCreate);
            // @ts-ignore
            (global as any).__testApi.enqueueCardAction?.(cardCreate);
        });

        // assert queues
        // @ts-ignore
        let listQueue = (global as any).__testApi
            .getQueue()
            .filter((a: any) => a.type === 'LIST_CREATE');
        // @ts-ignore
        let cardQueue = (global as any).__testApi
            .getQueue()
            .filter((a: any) => a.type === 'CARD_CREATE');
        expect(listQueue.length).toBe(1);
        expect(cardQueue.length).toBe(1);

        // simulate server assigns real ids
        const realListId = 'list-1';
        const realCardId = 'card-1';
        act(() => {
            // set mappings and remove queued actions
            // @ts-ignore
            (global as any).__testApi.setMapping(listTempId, realListId);
            // @ts-ignore
            (global as any).__testApi.removeListAction(listTempId);
            // @ts-ignore
            (global as any).__testApi.setMapping(cardTempId, realCardId);
            // @ts-ignore
            (global as any).__testApi.removeCardAction(cardTempId);
        });

        // mappings exist
        // @ts-ignore
        const tmap = (global as any).__testApi.getTempMap();
        expect(tmap[listTempId]).toBe(realListId);
        expect(tmap[cardTempId]).toBe(realCardId);

        // queues cleared for those items
        // @ts-ignore
        const remaining = (global as any).__testApi.getQueue();
        expect(
            remaining.find((a: any) => a.type === 'LIST_CREATE')
        ).toBeUndefined();
        expect(
            remaining.find((a: any) => a.type === 'CARD_CREATE')
        ).toBeUndefined();
    });

    test('multiple queued actions for same item are squashed (create then update -> keep latest)', () => {
        act(() => {
            renderer.create(
                React.createElement(
                    AppProvider,
                    null,
                    React.createElement(TestConsumer)
                )
            );
        });

        const tempCardId = 'temp-card-squash';
        const cardObj = {
            id: undefined,
            tempId: tempCardId,
            title: 'Initial',
        } as any;

        act(() => {
            // add card
            // @ts-ignore
            (global as any).__testApi.addCard?.(cardObj);
            // enqueue create
            const createAction = {
                type: 'CARD_CREATE',
                payload: { data: { ...cardObj } },
            } as any;
            // enqueue update (should squash with create if same type and id)
            const updateAction = {
                type: 'CARD_CREATE',
                payload: { data: { ...cardObj, title: 'Updated' } },
            } as any;
            // @ts-ignore
            (global as any).__testApi.enqueueCardAction?.(createAction);
            // @ts-ignore
            (global as any).__testApi.enqueueCardAction?.(updateAction);
        });

        // queue should have a single CARD_CREATE for this temp id and reflect last payload
        // @ts-ignore
        const q = (global as any).__testApi
            .getQueue()
            .filter((a: any) => a.type === 'CARD_CREATE');
        expect(q.length).toBe(1);
        expect(q[0].payload.data.title).toBe('Updated');
    });
});
