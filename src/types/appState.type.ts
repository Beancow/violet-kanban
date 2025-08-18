type BoardList = {
    id: string;
    boardId: string;
    title: string;
    description?: string;
    position: number;
};

type Board = {
    id: string;
    organizationId: string; // Reference to parent organization
    title: string;
    description?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    lists: BoardList[];
    cards: BoardCard[];
};

type BoardCard = {
    id: string;
    title: string;
    description?: string;
    priority?: number;
    listId: string; // This links the card to its parent list
    completed?: boolean; // <-- Add this field
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

type User = {
    id: string;
    displayName: string;
    name: string;
    email: string;
    photoURL?: string;
    currentBoardId: string | null;
    currentListId: string | null;
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
        tempId: string;
        board: Board;
    };
    error?: Error;
};

export type CreateCardResult = {
    success: boolean;
    data?: {
        tempId: string;
        card: BoardCard;
    };
    error?: Error;
};

export type {
    BoardList,
    Board,
    BoardCard,
    User,
    Organization,
    OrganizationMember,
};
