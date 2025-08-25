import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { useQueues } from '../../../src/providers/QueueProvider';

function TestComponent() {
    const q = useQueues();
    return (
        <div>
            <button
                onClick={() =>
                    q.enqueueCardAction({
                        type: 'update-card',
                        payload: { data: { id: 'c1' } },
                        timestamp: Date.now(),
                    } as any)
                }
            >
                Enqueue
            </button>
            <div data-testid='count'>{q.state.cardActionQueue.length}</div>
        </div>
    );
}

describe('QueueProvider', () => {
    it('wraps enqueued actions into QueueItem and dedupes by id', async () => {
        renderWithProviders(<TestComponent />);
        const btn = screen.getByText('Enqueue');
        const count = () =>
            Number(screen.getByTestId('count').textContent || '0');
        expect(count()).toBe(0);
        await userEvent.click(btn);
        expect(count()).toBe(1);
        await userEvent.click(btn);
        expect(count()).toBe(1); // deduped
    });
});
