'use client';

import { Dialog } from '@radix-ui/themes';
import { CardFormWrapper } from '@/components/forms/CardFormWrapper';
import { BoardCard } from '@/types/appState.type';
import { useUi } from '@/providers/UiProvider';

interface CreateCardModalProps {
    card?: BoardCard;
    listId: string;
}

export function CreateCardModal({ card, listId }: CreateCardModalProps) {
    const ui = useUi();
    return (
        <Dialog.Root open={ui.openModal.name === 'create-card'}>
            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Create New Card</Dialog.Title>
                <CardFormWrapper card={card} listId={listId} />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateCardModal;
