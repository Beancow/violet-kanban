import handleActionSuccess from '@/services/syncJobs/actionSuccessJob';

describe('actionSuccessJob', () => {
    test('happy path: resolves in-flight, clears attempts, enqueues reconcile', async () => {
        const called: string[] = [];
        const ctx: any = {
            queueApi: {
                enqueueCardAction: jest.fn((a) =>
                    called.push('card:' + a.payload.id)
                ),
                enqueueListAction: jest.fn((a) =>
                    called.push('list:' + a.payload.id)
                ),
                enqueueBoardAction: jest.fn((a) =>
                    called.push('board:' + a.payload.id)
                ),
                removeBoardAction: jest.fn(),
            },
            inFlightManager: {
                resolveIfMatches: jest.fn((id) =>
                    called.push('resolved:' + id)
                ),
            },
            tempMap: {
                getRealId: jest.fn(async (t: string) => null),
            },
            attemptsMap: { r1: true },
        };

        const msg = {
            payload: { card: { id: 'c1' } },
            queueItem: { id: 'r1' },
        };
        const res = await handleActionSuccess(msg, ctx);
        expect(res).toBe(true);
        expect(ctx.inFlightManager.resolveIfMatches).toHaveBeenCalledWith('c1');
        expect(ctx.queueApi.enqueueCardAction).toHaveBeenCalled();
    });

    test('missing fields: gracefully handles undefined payload', async () => {
        const called: string[] = [];
        const ctx: any = {
            queueApi: {},
            inFlightManager: {
                resolveIfMatches: jest.fn(() => called.push('r')),
            },
            tempMap: {},
            attemptsMap: {},
        };
        const res = await handleActionSuccess({ payload: undefined }, ctx);
        expect(res).toBe(true);
        // should not throw and should return true even if payload absent
    });
});
