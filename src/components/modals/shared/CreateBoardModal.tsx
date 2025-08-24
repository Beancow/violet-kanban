'use client';

import { Dialog } from '@radix-ui/themes';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { BoardFormWrapper } from '../../forms/BoardFormWrapper';
import { useUi } from '@/providers/UiProvider';

interface CreateBoardModalProps {
    // Controlled dialog props passed from page-level components
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    isSubmitting?: boolean;
    // optional explicit overrides (from tests/stories or callers)
    board?: Board;
    onSubmit?: (data: BoardFormValues) => Promise<void> | void;
    // When true, the Dialog title will be visually hidden but remain available to
    // screen readers (useful when a design uses a custom header elsewhere).
    hideTitle?: boolean;
}

/**
 * CreateBoardModal
 *
 * Usage notes:
 * - Preferred pattern: open this modal via the central `useUi()` hook by calling
 *   `ui.openModal({ name: 'create-board', props: { board, onSubmit } })`. This keeps
 *   the modal payloads colocated with UI state and makes the component easy to
 *   reuse from multiple places (pages, storybook, tests).
 * - The component also accepts explicit controlled props (`open`, `onOpenChange`,
 *   `isSubmitting`) and optional `board` / `onSubmit` overrides for tests or when
 *   a caller wants to control the dialog directly.
 * - When moving this component to a shared location, prefer the hook-based
 *   `useUi()` pattern for callers instead of passing callbacks or adapters
 *   through non-React channels. The `adapter` registry is a test seam and should
 *   not be used as the primary runtime API for UI components.
 */
export default function CreateBoardModal({
    open: openProp,
    onOpenChange,
    isSubmitting: _isSubmitting,
    board: boardProp,
    onSubmit: onSubmitProp,
    hideTitle = false,
}: CreateBoardModalProps) {
    const ui = useUi();

    const modalProps = ui.openModal.props as
        | {
              board?: Board;
              onSubmit?: (d: BoardFormValues) => Promise<void> | void;
          }
        | null
        | undefined;

    const board = boardProp ?? modalProps?.board;
    const onSubmit = onSubmitProp ?? modalProps?.onSubmit;

    // prefer explicit controlled prop, otherwise derive from ui state
    const isOpen = openProp ?? ui.openModal.name === 'create-board';

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Description hidden>
                    This is a modal that allows you to create or edit a boards.
                </Dialog.Description>
                <Dialog.Title>
                    {hideTitle ? (
                        <VisuallyHidden>
                            {board?.title ? 'Edit Board' : 'Create Board'}
                        </VisuallyHidden>
                    ) : board?.title ? (
                        'Edit Board'
                    ) : (
                        'Create Board'
                    )}
                </Dialog.Title>
                <BoardFormWrapper board={board} onSubmit={onSubmit} />
            </Dialog.Content>
        </Dialog.Root>
    );
}
