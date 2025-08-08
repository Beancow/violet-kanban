import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { Board, BoardList, BoardCard } from '@/types/appState.type';
import { getBoardsAction } from '@/lib/firebase/boardServerActions';
import { useUser } from './UserProvider';
import { useAuth } from './AuthProvider';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useSync } from './SyncProvider';

interface BoardDataContextType {
    boards: Board[];
    loading: boolean;
    addBoard: (board: Board) => void;
    addListToBoard: (boardId: string, list: BoardList) => void;
    addCardToBoard: (boardId: string, card: BoardCard) => void;
    softDeleteCard: (boardId: string, cardId: string) => void;
    restoreCard: (boardId: string, cardId: string) => void;
    setBoardCards: (boardId: string, cards: BoardCard[]) => void;
    deleteList: (boardId: string, listId: string) => void;
    deleteBoard: (boardId: string) => void;
}

const BoardDataContext = createContext<BoardDataContextType>({
    boards: [],
    loading: true,
    addBoard: () => {},
    addListToBoard: () => {},
    addCardToBoard: () => {},
    softDeleteCard: () => {},
    restoreCard: () => {},
    setBoardCards: () => {},
    deleteList: () => {},
    deleteBoard: () => {},
});

export function BoardDataProvider({ children }: { children: ReactNode }) {
    const [boards, setBoards] = useLocalStorage<Board[]>('boards', []);
    const [loading, setLoading] = useState(true);
    const { currentOrganizationId } = useUser();
    const { actionQueue, addActionToQueue } = useSync();

    useEffect(() => {
        const fetchBoards = async () => {
            if (currentOrganizationId) {
                if (navigator.onLine) {
                    const { data, success } = await getBoardsAction(
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

    const addBoard = (newBoard: Board) => {
        if (navigator.onLine) {
            fetch('/api/boards/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: newBoard }),
            });
        } else {
            addActionToQueue({ type: 'addBoard', payload: { data: newBoard } });
        }
        setBoards((prevBoards) => [...prevBoards, newBoard]);
    };

    const addListToBoard = (boardId: string, newList: BoardList) => {
        if (navigator.onLine) {
            fetch('/api/lists/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: newList }),
            });
        } else {
            addActionToQueue({ type: 'addList', payload: { data: newList } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, lists: [...(board.lists || []), newList] }
                    : board
            )
        );
    };

    const addCardToBoard = (boardId: string, newCard: BoardCard) => {
        if (navigator.onLine) {
            fetch('/api/cards/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ boardId, newCard }),
            });
        } else {
            addActionToQueue({ type: 'addCard', payload: { boardId, newCard } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, cards: [...(board.cards || []), newCard] }
                    : board
            )
        );
    };

    const softDeleteCard = (boardId: string, cardId: string) => {
        if (navigator.onLine) {
            fetch('/api/cards/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ boardId, cardId }),
            });
        } else {
            addActionToQueue({ type: 'softDeleteCard', payload: { boardId, cardId } });
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
    };

    const restoreCard = (boardId: string, cardId: string) => {
        if (navigator.onLine) {
            fetch('/api/cards/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ boardId, cardId }),
            });
        } else {
            addActionToQueue({ type: 'restoreCard', payload: { boardId, cardId } });
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
    };

    const setBoardCards = (boardId: string, newCards: BoardCard[]) => {
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId ? { ...board, cards: newCards } : board
            )
        );
    };

    const deleteList = (boardId: string, listId: string) => {
        if (navigator.onLine) {
            fetch('/api/lists/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orgId: useUser().currentOrganizationId, boardId, listId }),
            });
        } else {
            addActionToQueue({ type: 'deleteList', payload: { orgId: useUser().currentOrganizationId, boardId, listId } });
        }
        setBoards((prevBoards) =>
            prevBoards.map((board) =>
                board.id === boardId
                    ? { ...board, lists: (board.lists || []).filter(list => list.id !== listId) }
                    : board
            )
        );
    };

    const deleteBoard = (boardId: string) => {
        if (navigator.onLine) {
            fetch('/api/boards/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orgId: useUser().currentOrganizationId, boardId }),
            });
        } else {
            addActionToQueue({ type: 'deleteBoard', payload: { orgId: useUser().currentOrganizationId, boardId } });
        }
        setBoards((prevBoards) => prevBoards.filter(board => board.id !== boardId));
    };

    const mergedBoards = boards.map(board => {
        const pendingActions = actionQueue.filter(action => action.payload.boardId === board.id);
        if (pendingActions.length === 0) {
            return board;
        }

        const newBoard = { ...board };

        pendingActions.forEach(action => {
            switch (action.type) {
                case 'addCard':
                    newBoard.cards = [...(newBoard.cards || []), action.payload.newCard];
                    break;
                case 'softDeleteCard':
                    newBoard.cards = (newBoard.cards || []).map(card =>
                        card.id === action.payload.cardId ? { ...card, isDeleted: true, listId: null } : card
                    );
                    break;
                case 'restoreCard':
                    newBoard.cards = (newBoard.cards || []).map(card =>
                        card.id === action.payload.cardId ? { ...card, isDeleted: false } : card
                    );
                    break;
                case 'deleteList':
                    newBoard.lists = (newBoard.lists || []).filter(list => list.id !== action.payload.listId);
                    break;
            }
        });

        return newBoard;
    }).filter(board => {
        // Filter out boards that have a pending deleteBoard action
        return !actionQueue.some(action => action.type === 'deleteBoard' && action.payload.boardId === board.id);
    });

    return (
        <BoardDataContext.Provider
            value={{
                boards: mergedBoards,
                loading,
                addBoard,
                addListToBoard,
                addCardToBoard,
                softDeleteCard,
                restoreCard,
                setBoardCards,
                deleteList,
                deleteBoard,
            }}
        >
            {children}
        </BoardDataContext.Provider>
    );
}

export const useBoardData = () => {
    return useContext(BoardDataContext);
};