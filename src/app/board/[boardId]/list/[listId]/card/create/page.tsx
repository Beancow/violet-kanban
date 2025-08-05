'use client';
import { TodoForm } from '@/app/components/forms/TodoForm';
import { useUser } from '@/contexts/UserProvider';
import { createTodo } from '@/lib/firebase/todoServerActions';
import { useRouter, useParams } from 'next/navigation';

export default function CardCreate() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const { boardId, listId } = params;

    const handleCreateTodo = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (!user || !user.currentOrganizationId) {
            alert(
                'You must be logged in and belong to an organization to create a todo.'
            );
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createTodo(
            formData,
            user?.id,
            user?.currentOrganizationId,
            boardId as string,
            listId as string
        );
        if (result.success) {
            router.push(`/board/${boardId}`);
        } else {
            console.error('Error creating todo:', result.data);
        }
    };

    return (
        <div>
            <h1>Create Card</h1>
            <TodoForm user={user} onSubmit={handleCreateTodo} />
        </div>
    );
}
