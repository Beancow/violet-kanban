import { createBoardServerAction } from '@/lib/firebase/boardServerActions';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { BoardForm } from '@/app/components/forms/BoardForm';
import { Board } from '@/types/appState.type';

export default function CreateBoardPage() {
    const { user } = useUser();
    const { authUser } = useAuth();

    const handleCreateBoard = async (formData: FormData) => {
        if (!user || !authUser) {
            alert('You must be logged in to create a board.');
            return;
        }

        
        const boardData: Omit<Board, 'id'> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            organizationId: user.organizationIds[0], // Assuming the first organization for now
            ownerId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [],
        };

        const result = await createBoardServerAction(boardData, user.id, user.organizationIds[0]);

        if (result.success) {
            alert('Board created successfully!');
        } else {
            alert(`Error creating board: ${result.error?.message}`);
        }
    };

    return (
        <BoardForm user={user} onSubmit={handleCreateBoard} />
    );
}
