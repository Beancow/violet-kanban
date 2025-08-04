import { firebaseDB } from '@/lib/firebase/firebase-config';
import { Todo } from '@/types/appState.type';
import { getDocs, getDoc, collection, doc, addDoc } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

export async function getAllTodosAction(orgId: string, boardId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view todos'),
        };
    }

    const todosCollection = collection(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/todos`
    );
    try {
        const todosSnapshot = await getDocs(todosCollection);
        const todosList: Todo[] = todosSnapshot.docs.map((doc) =>
            doc.data().withConverter(dataConverter<Todo>())
        );
        return {
            success: true,
            data: todosList,
        };
    } catch (error) {
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to fetch todos', { cause: error }),
        };
    }
}

export async function getTodoAction(
    orgId: string,
    boardId: string,
    todoId: string
) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view todos'),
        };
    }

    const todoDoc = doc(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/todos/${todoId}`
    );
    try {
        const response = await getDoc(todoDoc);
        const todo: Todo = response
            .data()
            ?.withConverter(dataConverter<Todo>());
        return {
            success: true,
            data: todo,
        };
    } catch (error) {
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to fetch todo', { cause: error }),
        };
    }
}

export const createTodo = async (
    data: FormData,
    uid: string,
    boardId: string
) => {
    const todo = {
        title: data.get('title')?.valueOf(),
        description: data.get('description')?.valueOf(),
        completed: false,
    };

    if (!todo.title || !todo.description) {
        throw new Error('Invalid data');
    }

    const response = await addDoc(
        collection(firebaseDB, `users/${uid}/boards/${boardId}/todos`),
        { ...todo }
    );

    return {
        success: true,
        data: response,
    };
};
