import type { Board, BoardList, BoardCard } from '@/types/appState.type';
import { mockOrganizations } from './mockOrganizations';

const ORG_ID = mockOrganizations[0]?.id ?? 'org-1';

export const mockBoards: Board[] = [
    {
        id: 'board-1',
        organizationId: ORG_ID,
        title: 'Demo Board',
        description: 'A demo board for local testing.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lists: [
            {
                id: 'list-1',
                title: 'To Do',
                description: 'Tasks to start',
                position: 1,
                boardId: 'board-1',
                organizationId: ORG_ID,
            },
            {
                id: 'list-2',
                title: 'Done',
                description: 'Finished tasks',
                position: 2,
                boardId: 'board-1',
                organizationId: ORG_ID,
            },
        ],
        cards: [
            {
                id: 'card-1',
                title: 'Try drag & drop',
                description: 'Move this card between lists!',
                priority: 1,
                listId: 'list-1',
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'card-2',
                title: 'Read docs',
                description: 'Check the markdown in /docs',
                priority: 2,
                listId: 'list-1',
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'card-3',
                title: 'Completed Example',
                description: 'This card is done!',
                priority: 3,
                listId: 'list-2',
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            // Loose cards (no listId)
            {
                id: 'card-loose-1',
                title: 'Loose Card 1',
                description: 'This card is not assigned to any list.',
                priority: 4,
                listId: null,
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'card-loose-2',
                title: 'Loose Card 2',
                description: 'Another loose card for testing.',
                priority: 5,
                listId: null,
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            // Deleted loose cards
            {
                id: 'card-loose-3',
                title: 'Deleted Loose Card',
                description: 'This loose card is deleted.',
                priority: 6,
                listId: null,
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'card-loose-4',
                title: 'Another Deleted Loose Card',
                description: 'Another deleted loose card for testing.',
                priority: 7,
                listId: null,
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            // Cards with random listId not in mock lists
            {
                id: 'card-orphan-1',
                title: 'Orphan Card 1',
                description: 'This card has a random listId not in mock lists.',
                priority: 8,
                listId: 'random-list-1',
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'card-orphan-2',
                title: 'Orphan Card 2',
                description: 'Another orphan card for testing.',
                priority: 9,
                listId: 'random-list-2',
                boardId: 'board-1',
                organizationId: ORG_ID,
                completed: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
    },
];

// Flatten lists and cards for top-level mock arrays, adding organizationId and boardId
export const mockLists: BoardList[] = mockBoards.flatMap((board) =>
    board.lists.map((list) => ({
        ...list,
        boardId: board.id,
        organizationId: board.organizationId,
    }))
);

export const mockCards: BoardCard[] = mockBoards.flatMap((board) =>
    board.cards.map((card) => ({
        ...card,
        boardId: board.id,
        organizationId: board.organizationId,
    }))
);
