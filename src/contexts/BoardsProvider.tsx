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
    currentBoard: string | null;
    loading: boolean;
}

const BoardsContext = createContext<BoardsContextType>({
    boards: [],
    currentBoard: null,
    loading: true,
});

export function BoardsProvider({ children }: { children: ReactNode }) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [currentBoard, setCurrentBoard] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        const fetchBoards = async () => {
            if (user && user.currentOrganizationId) {
                const { data, success } = await getBoardsAction(
                    user.currentOrganizationId
                );
                if (success && data) {
                    setBoards(data);
                }
                if (user.currentBoardId) {
                    const currentBoard = user.currentBoardId;
                    setCurrentBoard(currentBoard);
                }
                setLoading(false);
            }
        };
        fetchBoards();
    }, [user]);

    return (
        <BoardsContext.Provider
            value={{
                boards,
                currentBoard,
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
