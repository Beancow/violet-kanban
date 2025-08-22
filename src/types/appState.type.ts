type BoardList = {
    id: string;
    boardId: string;
    title: string;
    description?: string;
    position: number;
    organizationId: string;
    createdBy?: Creator;
    createdAt?: string;
    updatedAt?: string;
};

type Board = {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    lists: BoardList[];
    cards: BoardCard[];
    createdBy?: Creator;
};

type BoardCard = {
    id: string;
    title: string;
    description?: string;
    priority?: number;
    listId: string | null;
    boardId: string;
    organizationId: string;
    completed?: boolean;
    isDeleted?: boolean;
    isArchived?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: Creator;
};

type User = {
    id: string;
    displayName: string;
    name: string;
    email: string;
    photoURL?: string;
    createdAt?: string;
    updatedAt?: string;
};

type Creator = {
    userId: string;
    name: string;
    email: string;
};

type Organization = {
    id: string;
    name: string;
    orgType?: 'personal' | 'company' | 'private';
    members?: {
        [userId: string]: 'owner' | 'admin' | 'editor' | 'member';
    };
    companyName?: string;
    companyWebsite?: string;
    logoURL?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    createdBy?: Creator;
};

export type CreateOrganizationResult =
    | { success: true; data: { orgId: string; message: string } }
    | { success: false; error: Error };

export type AddMemberToOrganizationResult =
    | { success: true; data: { message: string } }
    | { success: false; error: Error };

export type CreateBoardResult = {
    success: boolean;
    data?: {
        board: Board;
    };
    error?: Error;
};

export type CreateCardResult = {
    success: boolean;
    data?: {
        card: BoardCard;
    };
    error?: Error;
};

export type { BoardList, Board, BoardCard, User, Organization };
