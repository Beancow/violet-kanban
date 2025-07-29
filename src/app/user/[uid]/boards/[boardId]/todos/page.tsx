'use client';

import { useAppState } from '@/components/AppStateProvider';

export default function UserTodoPage() {
    const { todos, user } = useAppState();
    return (
        <div>
            <h1>User Todo Page</h1>
            {todos.map((todo) => (
                <div key={todo.id}>
                    <h2>{todo.title}</h2>
                    <p>{todo.description}</p>
                    <p>Completed: {todo.completed ? 'Yes' : 'No'}</p>
                    <p>
                        Created At: {new Date(todo.createdAt).toLocaleString()}
                    </p>
                    <p>
                        Updated At: {new Date(todo.updatedAt).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}
