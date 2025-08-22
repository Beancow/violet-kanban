'use client';

import { Dialog } from '@radix-ui/themes';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { BoardFormWrapper } from '../forms/BoardFormWrapper';
import { useUi } from '@/providers/UiProvider';

interface CreateBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: BoardFormValues) => void;
    isSubmitting?: boolean;
    board?: Board;
}

export default function CreateBoardModal({
    open,
    board,
}: CreateBoardModalProps) {
    const ui = useUi();

    return (
        <Dialog.Root open={ui.openModal.name === 'create-board'}>
            <Dialog.Content>
                <Dialog.Description hidden>
                    This is a modal that allows you to create or edit a boards.
                </Dialog.Description>
                <Dialog.Title>
                    {board?.title ? 'Edit Board' : 'Create Board'}
                </Dialog.Title>
                <BoardFormWrapper board={board} />
            </Dialog.Content>
        </Dialog.Root>
    );
}
