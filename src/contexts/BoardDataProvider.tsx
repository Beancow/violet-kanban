import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { Board, BoardList, BoardCard } from '@/types/appState.type';
import { getBoardsServerAction } from '@/lib/firebase/boardServerActions'; // Updated import
import { useUser } from './UserProvider';
import { useAuth } from './AuthProvider';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useSync } from './SyncProvider';

interface BoardDataContextType {
    boards: Board[];
    loading: boolean;
    handleAddBoard: (board: Board) => void;
    handleAddListToBoard: (boardId: string, list: BoardList) => void;
    handleAddCardToBoard: (boardId: string, card: BoardCard) => void;
    handleSoftDeleteCard: (boardId: string, cardId: string) => void;
    handleRestoreCard: (boardId: string, cardId: string) => void;
    handleSetBoardCards: (boardId: string, cards: BoardCard[]) => void;
    handleDeleteList: (boardId: string, listId: string) => void;
    handleDeleteBoard: (boardId: string) => void;
}

const BoardDataContext = createContext<BoardDataContextType>({
    boards: [],
    loading: true,
    handleAddBoard: () => {},
    handleAddListToBoard: () => {},
    handleAddCardToBoard: () => {},
    handleSoftDeleteCard: () => {},
    handleRestoreCard: () => {},
    handleSetBoardCards: () => {},
    handleDeleteList: () => {},
    handleDeleteBoard: () => {},
});

export function BoardDataProvider({ children }: { children: ReactNode }) {
    const [boards, setBoards] = useLocalStorage<Board[]>('boards', []);
    const [loading, setLoading] = useState(true);
    const { currentOrganizationId } = useUser();
    const { authUser } = useAuth();
    const { addActionToQueue } = useSync();

    useEffect(() => {
        const fetchBoards = async () => {
            if (currentOrganizationId) {
                if (navigator.onLine) {
                    const { data, success } = await getBoardsServerAction(
                        currentOrganizationId
                    );
                    if (success && data) {
                        setBoards(data.map(board => ({
                            ...board,
                            cards: (board.cards || []).filter(card => !card.isDeleted)
                        })));
                    }
                } else {
                    // Offline, use local storage data
                    console.log('Offline, using local storage data');
                }
                setLoading(false);
            }
        };
        fetchBoards();
    }, [currentOrganizationId, setBoards]);

    const handleAddBoard = useCallback(async (newBoard: Board) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/boards/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ data: newBoard, orgId: currentOrganizationId }),
            });
        } else {
            addActionToQueue({ type: 'addBoard', payload: { data: newBoard, orgId: currentOrganizationId } });
        }
        setBoards((prevBoards) => [...prevBoards, newBoard]);
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleAddListToBoard = useCallback(async (boardId: string, newList: BoardList) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/lists/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ data: newList, orgId: currentOrganizationId }),
            });
        } else {
            addActionToQueue({ type: 'addList', payload: { data: newList, orgId: currentOrganizationId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, lists: [...(board.lists || []), newList] }
                    : board
            )
        );
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleAddCardToBoard = useCallback(async (boardId: string, newCard: BoardCard) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/cards/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ boardId, newCard, orgId: currentOrganizationId }),
            });
        } else {
            addActionToQueue({ type: 'addCard', payload: { boardId, newCard, orgId: currentOrganizationId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, cards: [...(board.cards || []), newCard] }
                    : board
            )
        );
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleSoftDeleteCard = useCallback(async (boardId: string, cardId: string) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/cards/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ boardId, cardId, orgId: currentOrganizationId }),
            });
        } else {
            addActionToQueue({ type: 'softDeleteCard', payload: { boardId, cardId, orgId: currentOrganizationId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? {
                          ...board,
                          cards: (board.cards || []).map((card) =>
                              card.id === cardId ? { ...card, isDeleted: true, listId: null } : card
                          ),
                      }
                    : board
            )
        );
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleRestoreCard = useCallback(async (boardId: string, cardId: string) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/cards/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ boardId, cardId, orgId: currentOrganizationId }),
            });
        } else {
            addActionToQueue({ type: 'restoreCard', payload: { boardId, cardId, orgId: currentOrganizationId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? {
                          ...board,
                          cards: (board.cards || []).map((card) =>
                              card.id === cardId ? { ...card, isDeleted: false } : card
                          ),
                      }
                    : board
            )
        );
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleSetBoardCards = useCallback((boardId: string, newCards: BoardCard[]) => {
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId ? { ...board, cards: newCards } : board
            )
        );
    }, [setBoards]);

    const handleDeleteList = useCallback(async (boardId: string, listId: string) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/lists/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ orgId: currentOrganizationId, boardId, listId }),
            });
        } else {
            addActionToQueue({ type: 'deleteList', payload: { orgId: currentOrganizationId, boardId, listId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, lists: (board.lists || []).filter(list => list.id !== listId) }
                    : board
            )
        );
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    const handleDeleteBoard = useCallback(async (boardId: string) => {
        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('User not authenticated.');
            return;
        }

        if (navigator.onLine) {
            fetch('/api/boards/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Organization-Id': currentOrganizationId || '',
                },
                body: JSON.stringify({ orgId: currentOrganizationId, boardId }),
            });
        } else {
            addActionToQueue({ type: 'deleteBoard', payload: { orgId: currentOrganizationId, boardId } });
        }
        setBoards((prevBoards) => prevBoards.filter(board => board.id !== boardId));
    }, [addActionToQueue, authUser, currentOrganizationId, setBoards]);

    return (
        <BoardDataContext.Provider
            value={{
                boards: boards,
                loading,
                handleAddBoard,
                handleAddListToBoard,
                handleAddCardToBoard,
                handleSoftDeleteCard,
                handleRestoreCard,
                handleSetBoardCards,
                handleDeleteList,
                handleDeleteBoard,
            }}
        >
            {children}
        </BoardDataContext.Provider>
    );
}

export const useBoardData = () => {
    return useContext(BoardDataContext);
};