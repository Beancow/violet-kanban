import { getTodo } from "@/app/actions"; 
import { Card, Heading } from "@radix-ui/themes";

export default async function TodoDetails({ params }: { params: Promise<{ todoId: string, uid: string, boardId: string }> }) {
    const { todoId, uid, boardId } = await params;

    if (!todoId || !uid || !boardId) {
        return <div>Loading...</div>;
    }

    const todo = await getTodo(uid, boardId, todoId);

    if (!todo) {
        return <div>Todo not found.</div>;
    }

    if (!todo.data) {
        return <div>Todo data is not available.</div>;
    }

    return (
        <Card>
            <Heading>Todo Details</Heading>
            <p>Viewing details for todo: {todo.data.title}</p>
            <Heading>{todo.data.id}</Heading>
            <p>{todo.data.description}</p>
            <p>Completed: {todo.data.completed ? 'Yes' : 'No'}</p>
        </Card>
    );
}
