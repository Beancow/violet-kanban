'use client';

import { Dialog } from '@radix-ui/themes';
import { CardFormWrapper } from '@/components/forms/CardFormWrapper';
import { BoardCard } from '@/types/appState.type';
import useUiStore from '@/store/uiStore';

interface CreateCardModalProps {
    card?: BoardCard;
    listId: string;
}

export function CreateCardModal({ card, listId }: CreateCardModalProps) {
    const openModal = useUiStore((s) => s.openModal);
    return (
        <Dialog.Root open={openModal.name === 'createCard'}>
            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Create New Card</Dialog.Title>
                <CardFormWrapper card={card} listId={listId} />
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateCardModal;
