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
        const { createReducerHarness } = require('../helpers/reducerHarness');
        const api = createReducerHarness();

        // create a temporary board (no id, only tempId)
        const tempId = 'temp-board-1';
        const boardObj = {
            id: undefined,
            tempId,
            name: 'Temp Board',
        } as any;

        // add board and enqueue create action via the test API
        api.addBoard(boardObj as any);
        api.enqueueBoardAction({
            type: 'BOARD_CREATE',
            payload: { data: { ...boardObj } },
        } as any);

        // verify board present in boards
        let boards = api.getBoards();
        expect(Array.isArray(boards)).toBe(true);
        expect(boards.find((b: any) => b.tempId === tempId)).toBeTruthy();

        // verify queue has one action
        let queue = api.getQueue();
        expect(queue.length).toBe(1);
        expect(queue[0].type).toBe('BOARD_CREATE');

        // simulate server response: assign real id
        const realId = 'board-123';
        api.setMapping(tempId, realId);
        api.removeBoardAction(tempId);

        // temp map should contain mapping
        const mapping = api.getTempMap();
        expect(mapping[tempId]).toBe(realId);

        // queue should be empty now
        queue = api.getQueue();
        expect(queue.length).toBe(0);
        // no unmount needed for reducer harness
    });

    test('create list and card -> enqueue actions -> reconcile temp ids across providers', () => {
        const { createReducerHarness } = require('../helpers/reducerHarness');
        const api = createReducerHarness();

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

        api.addList(listObj as any);
        api.addCard(cardObj as any);
        api.enqueueListAction({
            type: 'LIST_CREATE',
            payload: { data: { ...listObj } },
        } as any);
        api.enqueueCardAction({
            type: 'CARD_CREATE',
            payload: { data: { ...cardObj } },
        } as any);

        // assert queues
        let listQueue = api
            .getQueue()
            .filter((a: any) => a.type === 'LIST_CREATE');
        let cardQueue = api
            .getQueue()
            .filter((a: any) => a.type === 'CARD_CREATE');
        expect(listQueue.length).toBe(1);
        expect(cardQueue.length).toBe(1);

        // simulate server assigns real ids
        const realListId = 'list-1';
        const realCardId = 'card-1';
        api.setMapping(listTempId, realListId);
        api.removeListAction(listTempId);
        api.setMapping(cardTempId, realCardId);
        api.removeCardAction(cardTempId);

        // mappings exist
        const tmap = api.getTempMap();
        expect(tmap[listTempId]).toBe(realListId);
        expect(tmap[cardTempId]).toBe(realCardId);

        // queues cleared for those items
        const remaining = api.getQueue();
        expect(
            remaining.find((a: any) => a.type === 'LIST_CREATE')
        ).toBeUndefined();
        expect(
            remaining.find((a: any) => a.type === 'CARD_CREATE')
        ).toBeUndefined();
        // no unmount needed for reducer harness
    });

    test('multiple queued actions for same item are squashed (create then update -> keep latest)', () => {
        const { createReducerHarness } = require('../helpers/reducerHarness');
        const api = createReducerHarness();

        const tempCardId = 'temp-card-squash';
        const cardObj = {
            id: undefined,
            tempId: tempCardId,
            title: 'Initial',
        } as any;

        api.addCard(cardObj as any);
        api.enqueueCardAction({
            type: 'CARD_CREATE',
            payload: { data: { ...cardObj } },
        } as any);
        api.enqueueCardAction({
            type: 'CARD_CREATE',
            payload: { data: { ...cardObj, title: 'Updated' } },
        } as any);

        // queue should have a single CARD_CREATE for this temp id and reflect last payload
        const q = api.getQueue().filter((a: any) => a.type === 'CARD_CREATE');
        expect(q.length).toBe(1);
        expect(q[0].payload.data.title).toBe('Updated');
        // no unmount needed for reducer harness
    });
});
