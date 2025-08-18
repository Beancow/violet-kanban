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
                boardId: 'board-1',
                title: 'To Do',
                description: 'Tasks to start',
                position: 1,
            },
            {
                id: 'list-2',
                boardId: 'board-1',
                title: 'Done',
                description: 'Finished tasks',
                position: 2,
            },
        ],
        cards: [
            {
                id: 'card-1',
                title: 'Try drag & drop',
                description: 'Move this card between lists!',
                priority: 1,
                listId: 'list-1',
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
                completed: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
    },
];

// Flatten lists and cards for top-level mock arrays
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
