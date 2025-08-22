'use client';

import { Dialog } from '@radix-ui/themes';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { BoardFormWrapper } from '../forms/BoardFormWrapper';
import useUiStore from '@/store/uiStore';

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
    const openModal = useUiStore((state) => state.openModal);

    return (
        <Dialog.Root open={openModal.name === 'create-board'}>
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
