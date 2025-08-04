
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Todo } from '@/types/appState.type';
import { getAllTodosAction } from '@/lib/firebase/todoServerActions';
import { useUser } from './UserProvider';
import { useBoards } from './BoardsProvider';

interface TodosContextType {
    todos: Todo[];
    loading: boolean;
}

const TodosContext = createContext<TodosContextType>({ todos: [], loading: true });

export function TodosProvider({ children }: { children: ReactNode }) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const { boards } = useBoards();

    useEffect(() => {
        const fetchTodos = async () => {
            if (user && user.currentOrganizationId && boards.length > 0) {
                const allTodos: Todo[] = [];
                for (const board of boards) {
                    const { data, success } = await getAllTodosAction(user.currentOrganizationId, board.id);
                    if (success && data) {
                        allTodos.push(...data);
                    }
                }
                setTodos(allTodos);
                setLoading(false);
            }
        };
        fetchTodos();
    }, [user, boards]);

    return (
        <TodosContext.Provider value={{ todos, loading }}>
            {children}
        </TodosContext.Provider>
    );
}

export const useTodos = () => {
    return useContext(TodosContext);
};
