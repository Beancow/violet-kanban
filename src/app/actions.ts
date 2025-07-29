'use server';
import {
    firebaseGetFirestore,
    firebaseAuth,
} from '@/lib/firebase/firebase-config';
import { organizationConverter } from '@/lib/firebase/firebaseServerActionConverters';
import {
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    collection,
} from 'firebase/firestore';

const auth = firebaseAuth;

async function checkPermissionInDatabase(
    uid: string,
    resource: string
): Promise<boolean> {
    const db = firebaseGetFirestore();
    const orgDoc = doc(db, `organizations/${resource}`);
    const orgSnapshot = await getDoc(orgDoc);

    if (!orgSnapshot.exists()) {
        return false;
    }

    const orgData = orgSnapshot.data();
    const members: string[] = orgData.members || [];
    return members.includes(uid);
}

export async function getUser(uid: string) {
    const db = firebaseGetFirestore();
    const userDoc = doc(db, `users/${uid}`);
    const response = await getDoc(userDoc);

    if (!response.exists()) {
        throw new Error('User not found');
    }

    return {
        success: true,
        data: response.data(),
    };
}

export async function updateUser(data: FormData, uid: string) {
    const db = firebaseGetFirestore();
    const userDoc = doc(db, `users/${uid}`);

    const userData = {
        username: data.get('username')?.valueOf(),
        email: data.get('email')?.valueOf(),
        displayName: data.get('displayName')?.valueOf(),
    };

    if (!userData.username || !userData.email || !userData.displayName) {
        throw new Error('Invalid user data');
    }

    await updateDoc(userDoc, userData);

    return {
        success: true,
        data: userData,
    };
}

export async function checkUserPermission(params: {
    uid: string;
    resource: string;
}) {
    const { uid, resource } = params;
    const user = auth.currentUser;

    if (!user) {
        return {
            success: false,
            message: 'User is not authenticated',
        };
    }

    // Check if the user has permission to access the resource
    const hasPermission = await checkPermissionInDatabase(uid, resource);
    if (!hasPermission) {
        return {
            success: false,
            message: 'User does not have permission to access this resource',
        };
    }

    return {
        success: true,
    };
}

export async function checkAuthentication() {
    const user = auth.currentUser;
    if (!user) {
        return {
            success: false,
            message: 'User is not authenticated',
        };
    }

    return {
        success: true,
    };
}

export async function getOrgMembers(orgId: string) {
    const db = firebaseGetFirestore();
    const orgDoc = doc(db, `organizations/${orgId}`);
    return getDoc(orgDoc).then((response) => {
        if (!response.exists()) {
            throw new Error('Organization not found');
        }
        return response.data().members || [];
    });
}

export async function getOrganization(orgId: string) {
    const db = firebaseGetFirestore();

    if (!orgId) {
        throw new Error('Organization ID is required');
    }

    const orgDoc = doc(db, `organizations/${orgId}`);
    const response = await getDoc(orgDoc);

    if (!response.exists()) {
        throw new Error('Organization not found');
    }

    return {
        success: true,
        data: response.data(),
    };
}

export async function addMemberToOrganization(data: FormData) {
    const db = firebaseGetFirestore();

    const orgId = data.get('orgId')?.valueOf();
    const memberId = data.get('memberId')?.valueOf();

    const orgDoc = doc(db, `organizations/${orgId}`);
    const orgSnapshot = await getDoc(orgDoc);

    const members = orgSnapshot
        .data()
        ?.withConverter(organizationConverter).members;

    members.push(memberId);

    await updateDoc(orgDoc, { members });
    return {
        success: true,
        data: { orgId, memberId },
    };
}

export async function createOrganization(data: FormData) {
    const db = firebaseGetFirestore();

    const organization = {
        name: data.get('name')?.valueOf(),
        description: data.get('description')?.valueOf(),
        members: [],
    };
    if (!organization.name || !organization.description) {
        throw new Error('Invalid organization data');
    }

    const response = await addDoc(collection(db, 'organizations'), {
        ...organization,
    });

    return {
        success: true,
        data: response,
    };
}

export async function getOrganizationList({ orgId }: { orgId?: string }) {
    const db = firebaseGetFirestore();
    const orgsCollection = collection(db, 'organizations');
    const orgsSnapshot = await getDocs(orgsCollection);

    console.log('OrgId:', orgId);

    if (orgsSnapshot.empty) {
        return {
            success: false,
            data: [],
        };
    }
    try {
        const orgsList = orgsSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            current: orgId?.toString() === doc.id,
        }));
        return {
            success: true,
            data: orgsList,
        };
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return {
            success: false,
            data: [],
        };
    }
}

const createTodo = async (data: FormData, uid: string, boardId: string) => {
    const db = firebaseGetFirestore();

    const todo = {
        title: data.get('title')?.valueOf(),
        description: data.get('description')?.valueOf(),
        completed: false,
    };

    if (!todo.title || !todo.description) {
        throw new Error('Invalid data');
    }

    const response = await addDoc(
        collection(db, `users/${uid}/boards/${boardId}/todos`),
        { ...todo }
    );

    return {
        success: true,
        data: response,
    };
};

export async function createBoard(data: FormData, uid: string) {
    const db = firebaseGetFirestore();

    const board = {
        title: data.get('title')?.valueOf(),
        description: data.get('description')?.valueOf(),
    };

    if (!board.title || !board.description) {
        throw new Error('Invalid data');
    }

    const response = await addDoc(collection(db, `users/${uid}/boards`), {
        ...board,
    });

    return {
        success: true,
        data: response,
    };
}

export async function getTodos(uid: string, boardId: string) {
    const db = firebaseGetFirestore();
    const todosCollection = collection(
        db,
        `users/${uid}/boards/${boardId}/todos`
    );
    try {
        const todosSnapshot = await getDocs(todosCollection);

        const todosList = todosSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
        if (!todosList || todosList.length === 0) {
            return {
                success: false,
                data: [],
            };
        }

        return {
            success: true,
            data: todosList,
        };
    } catch (error) {
        console.error('Error fetching todos:', error);
        return {
            success: false,
            data: [],
        };
    }
}

export async function getBoards(username: string) {
    const db = firebaseGetFirestore();
    const boardsCollection = collection(db, `users/${username}/boards`);
    const boardsSnapshot = await getDocs(boardsCollection);
    const boardsList = boardsSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
    }));

    if (!boardsList || boardsList.length === 0) {
        return {
            success: false,
            data: [],
        };
    }

    return {
        success: true,
        data: boardsList,
    };
}

export async function getTodo(uid: string, boardId: string, todoId: string) {
    const db = firebaseGetFirestore();
    try {
        if (!todoId) {
            throw new Error('Todo ID is required');
        }
        const todoDoc = doc(
            db,
            `users/${uid}/boards/${boardId}/todos/${todoId}`
        );
        const response = await getDoc(todoDoc);

        if (!response.exists()) {
            throw new Error('Todo not found');
        }
        return {
            success: true,
            data: response.data(),
            error: null,
        };
    } catch (error) {
        console.error('Error fetching todo:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export { createTodo };
