'use client';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useBoards } from '@/contexts/BoardsProvider';
import { createList } from '@/lib/firebase/listServerActions';
import { ListForm } from '@/app/components/forms/ListForm';

export default function ListPage() {
    const router = useRouter();
    const params = useParams<{ boardId: string }>();
    const { user } = useUser();
    const { boards } = useBoards();
    const lists = boards.find(
        (board) => board.id === user?.currentBoardId
    )?.lists;
    const currentList = user?.currentListId;
    const orgId = user?.currentOrganizationId || '';
    const { boardId } = params;

    console.log(boardId);

    const handleCreateList = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (!user || !orgId || !user.currentBoardId || !boardId) {
            alert(
                'You must be logged in, belong to an organization, and be in a board to create a list.'
            );
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createList({
            data: formData,
            uid: user.id,
            orgId,
            boardId,
        });
        if (result.success) {
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
