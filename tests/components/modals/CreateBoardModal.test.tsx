/* @jest-environment jsdom */
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { useUi } from '@/providers/UiProvider';
import CreateBoardModal from '@/components/modals/shared/CreateBoardModal';
import { renderWithProviders } from '../../utils/renderWithProviders';

// Mock global fetch for tests
beforeAll(() => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve({}),
        })
    ) as jest.Mock;
});

afterAll(() => {
    // @ts-ignore
    delete global.fetch;
});

// Mock the heavy BoardFormWrapper to keep the test focused on modal wiring.
jest.mock('@/components/forms/BoardFormWrapper', () => ({
    BoardFormWrapper: ({ board, onSubmit }: any) => {
        return (
            // simple representation: show title and a submit button
            React.createElement(
                'div',
                { 'data-board-title': board?.title ?? '' },
                React.createElement(
                    'button',
                    {
                        onClick: () =>
                            onSubmit && onSubmit({ title: board?.title }),
                    },
                    'Submit'
                )
            )
        );
    },
}));

function AutoOpen({ board, onSubmit }: any) {
    const ui = useUi();
    React.useEffect(() => {
        // `UiApi` exposes `open(name, props)`; `openModal` is the state object.
        ui.open('create-board', { board, onSubmit });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}

describe('CreateBoardModal', () => {
    it('forwards modal payload and calls onSubmit', async () => {
        const board = {
            id: 'b1',
            title: 'Test Board',
            description: '',
            organizationId: 'o1',
        };
        const onSubmit = jest.fn();

        // Default: use real providers. If a test doesn't need Auth or Org behavior
        // you can pass mock components into renderWithProviders via options:
        // import { MockAuthProvider } from '../../utils/providerMocks';
        // renderWithProviders(<... />, { AuthProvider: MockAuthProvider });

        renderWithProviders(
            <>
                <AutoOpen board={board} onSubmit={onSubmit} />
                <CreateBoardModal />
            </>
        );

        // The mocked BoardFormWrapper renders a button with text 'Submit'.
        const btn = await screen.findByText('Submit');
        expect(btn).toBeInTheDocument();

        fireEvent.click(btn);

        expect(onSubmit).toHaveBeenCalled();
    });
});
