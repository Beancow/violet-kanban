import { firebaseDB } from '@/lib/firebase/firebase-config';
import { Todo } from '@/types/appState.type';
import { getDocs, getDoc, collection, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';

export async function getAllTodosAction(orgId: string, boardId: string) {
    const todosCollection = collection(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/todos`
    ).withConverter(dataConverter<Todo>());
    try {
        const todosSnapshot = await getDocs(todosCollection);
        const todosList: Todo[] = todosSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
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
    orgId: string,
    boardId: string,
    listId: string
) => {
    const todo = {
        title: data.get('title')?.valueOf(),
        description: data.get('description')?.valueOf(),
        completed: false,
        listId,
        ownerId: uid,
    };

    if (!todo.title || !todo.description) {
        throw new Error('Invalid data');
    }

    const response = await addDoc(
        collection(
            firebaseDB,
            `organizations/${orgId}/boards/${boardId}/todos`
        ),
        { ...todo }
    );

    return {
        success: true,
        data: response,
    };
};

export async function deleteTodoAction(
    orgId: string,
    boardId: string,
    todoId: string
) {
    const todoRef = doc(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/todos/${todoId}`
    );

    try {
        await deleteDoc(todoRef);
        return { success: true };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error deleting todo:', error);
        return {
            success: false,
            error: new Error('Failed to delete todo', { cause: error }),
        };
    }
}
