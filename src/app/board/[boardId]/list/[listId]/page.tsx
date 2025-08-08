'use client';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useBoards } from '@/contexts/BoardsProvider';
import { createListAction } from '@/lib/firebase/listServerActions';
import { ListForm } from '@/app/components/forms/ListForm';

import { useRequireOrganization } from '@/hooks/useRequireOrganization';

export default function ListPage() {
    useRequireOrganization();
    const router = useRouter();
    const params = useParams<{ boardId: string }>();
    const { user, currentOrganizationId } = useUser();
    const { boards } = useBoards();
    const lists = boards.find(
        (board) => board.id === user?.currentBoardId
    )?.lists;
    const currentList = user?.currentListId;
    const orgId = currentOrganizationId || '';
    const { boardId } = params;

    if (!user) {
        return null;
    }

    const handleCreateList = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const result = await createListAction({
            data: formData,
            uid: user?.id,
            orgId,
            boardId,
        });
        if (result.success && result.data) {
            router.push(`/board/${boardId}/list/${result.data.id}`);
        } else {
            alert(`Error: ${result.data}`);
        }
    };
    return (
        <div>
            <ListForm
                user={user}
                onSubmit={handleCreateList}
                list={lists?.find((list) => list.id === currentList)}
            />
        </div>
    );
}
