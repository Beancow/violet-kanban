import { firebaseGetFirestore } from '@/lib/firebase/firebase-config';
import { Todo } from '@/types/appState.type';
import {
    getDocs,
    getDoc,
    collection,
    doc,
} from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

const db = firebaseGetFirestore();

export async function getAllTodosAction(orgId: string, boardId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view todos'),
        };
    }

    const todosCollection = collection(
        db,
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
        db,
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
