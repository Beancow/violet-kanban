'use client';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { Board } from '@/types/appState.type';
import { getBoardsAction } from '@/lib/firebase/boardServerActions';
import { useUser } from './UserProvider';

interface BoardsContextType {
    boards: Board[];
    currentBoard: string | null | undefined;
    loading: boolean;
    setCurrentBoard: (boardId: string) => void;
}

const BoardsContext = createContext<BoardsContextType>({
    boards: [],
    currentBoard: null,
    loading: true,
    setCurrentBoard: () => {},
});

export function BoardsProvider({ children }: { children: ReactNode }) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, setCurrentBoard } = useUser();

    const currentBoard = user?.currentBoardId;

    useEffect(() => {
        const fetchBoards = async () => {
            if (user && user.currentOrganizationId) {
                const { data, success } = await getBoardsAction(
                    user.currentOrganizationId
                );
                if (success && data) {
                    setBoards(data);
                }
                setLoading(false);
            }
        };
        fetchBoards();
    }, [user, user?.currentOrganizationId]);

    return (
        <BoardsContext.Provider
            value={{
                boards,
                currentBoard,
                setCurrentBoard,
                loading,
            }}
        >
            {children}
        </BoardsContext.Provider>
    );
}

export const useBoards = () => {
    return useContext(BoardsContext);
};
