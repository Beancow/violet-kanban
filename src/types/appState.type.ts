type BoardList = {
    id: string;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    boardId: string;
    isArchived?: boolean;
    isDeleted?: boolean;
    position?: number;
    data?: {
        backgroundColor?: string;
    };
};

type Boards = {
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
};

type User = {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    currentBoardId?: string;
    currentOrganizationId?: string;
    allowedOrgs?: string[];
    createdAt?: Date;
    updatedAt?: Date;
};

type OrganizationMember = {
    id: string;
    name: string;
    photoURL?: string;
    updatedAt: Date;
    createdAt: Date;
    isAdmin: boolean;
    isOwner: boolean;
};

type Organization = {
    id?: string;
    name: string;
    type: 'personal' | 'company';
    members: OrganizationMember[];
    createdAt: Date;
    updatedAt: Date;
    data?: {
        companyName: string;
        companyWebsite: string;
        logoURL?: string;
    };
};

export type { BoardList, Boards, Todo, User, Organization, OrganizationMember };
