type BoardList = {
    id: string;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    position: number;
    data: {
        ownerId: string;
        boardId: string;
        isArchived?: boolean;
        isDeleted?: boolean;
        backgroundColor?: string;
    };
};

type Board = {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    organizationId?: string;
    members?: {
        userId: string;
        name: string;
        role: 'owner' | 'admin' | 'member' | 'observer';
        joinedAt: Date;
        leftAt?: Date;
    }[];
    lists?: BoardList[];
    todos?: Todo[];
    orphanedTodos?: Todo[];
    data?: {
        color?: string;
        icon?: string;
        backgroundImage?: string;
    };
    archived?: boolean;
    deleted?: boolean;
    isPublic?: boolean;
};

type Todo = {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    boardId: string;
    userId: string;
    ownerId: string;
};

type User = {
    id: string;
    displayName: string;
    name: string;
    email: string;
    photoURL?: string;
    currentBoardId: string | null;
    currentListId: string | null;
    currentOrganizationId: string | null;
    currentOrganization?: {
        id: string;
        role: 'owner' | 'admin' | 'editor' | 'member';
    };
    createdAt?: Date;
    updatedAt?: Date;
};

type OrganizationMember = {
    id: string;
    name: string;
    photoURL?: string;
    updatedAt: Date;
    createdAt: Date;
    role: 'owner' | 'admin' | 'editor' | 'member';
};

type Creator = {
    userId: string;
    name: string;
    email: string;
};

type Organization = {
    id: string;
    name: string;
    type: 'personal' | 'company';
    members: OrganizationMember[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: Creator;
    data?: {
        companyName: string;
        companyWebsite: string;
        logoURL?: string;
    };
};

export type CreateOrganizationResult =
    | { success: true; data: { orgId: string; message: string } }
    | { success: false; error: Error };

export type AddMemberToOrganizationResult =
    | { success: true; data: { message: string } }
    | { success: false; error: Error };

export type { BoardList, Board, Todo, User, Organization, OrganizationMember };
