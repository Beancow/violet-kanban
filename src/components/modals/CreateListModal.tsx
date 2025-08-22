'use client';

import { Dialog } from '@radix-ui/themes';
import { ListFormWrapper } from '@/components/forms/ListFormWrapper';

interface CreateListModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId: string;
}

export function CreateListModal({
    open,
    onOpenChange,
    boardId,
}: CreateListModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Create New List</Dialog.Title>
                <ListFormWrapper
                    user={null}
                    boardId={boardId}
                    onClose={() => onOpenChange(false)}
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateListModal;
