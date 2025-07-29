import { firebaseGetFirestore } from '@/lib/firebase/firebase-config';
import { Todo } from '@/types/appState.type';
import {
    addDoc,
    getDocs,
    getDoc,
    collection,
    doc,
    documentId,
} from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';

const db = firebaseGetFirestore();

export async function createTodoAction(
    data: FormData,
    uid: string,
    boardId: string
) {
    const todoDoc = collection(db, `users/${uid}/boards/${boardId}`);

    try {
        const todoData = await addDoc(todoDoc, data);
        const todo = todoData.withConverter(dataConverter<FormData>());
        return {
            success: true,
            data: {
                message: 'Todo created successfully, new Todo ID: ' + todo.id,
                id: todo.id,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error creating todo:', error);
        return {
            success: false,
            error: new Error('Failed to create todo', { cause: error }),
        };
    }
}

export async function getAllTodosAction(uid: string, boardId: string) {
    const todosCollection = collection(
        db,
        `users/${uid}/boards/${boardId}/todos`
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
    uid: string,
    boardId: string,
    todoId: string
) {
    const todoDoc = doc(db, `users/${uid}/boards/${boardId}/todos/${todoId}`);
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
