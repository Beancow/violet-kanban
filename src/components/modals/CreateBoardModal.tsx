'use client';

import { Dialog } from '@radix-ui/themes';
import { BoardForm } from '../forms/BoardForm';
import { Board } from '@/types/appState.type';

interface CreateBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    isSubmitting?: boolean;
    board?: Board;
}

export default function CreateBoardModal({
    open,
    onOpenChange,
    onSubmit,
    board,
}: CreateBoardModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Description hidden>
                    This is a modal that allows you to create or edit a boards.
                </Dialog.Description>
                <Dialog.Title>
                    {board?.title ? 'Edit Board' : 'Create Board'}
                </Dialog.Title>
                <BoardForm onSubmit={onSubmit} board={board} />
            </Dialog.Content>
        </Dialog.Root>
    );
}
