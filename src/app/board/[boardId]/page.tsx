'use client';
import { useParams } from 'next/navigation';
import { useVioletKanbanData } from '@/store/useVioletKanbanHooks';
import { BoardListComponent } from '@/components/BoardList';
import LooseCardsPanel from '@/components/LooseCardsPanel';
import styles from './BoardPage.module.css';

export default function BoardPage() {
    const { boardId } = useParams();
    const { boards, lists, cards } = useVioletKanbanData();

    const board = boards.find((b) => b.id === boardId);
    if (!board) return <div>Board not found.</div>;

    const boardLists = lists.filter((list) => list.boardId === boardId);

    const looseCards = cards.filter(
        (card) =>
            card.boardId === boardId &&
            (card.listId === null ||
                card.listId === undefined ||
                !Array.from(boardLists.map((list) => list.id)).includes(
                    card.listId
                ))
    );

    return (
        <div className={styles.boardPage}>
            <div className={styles.boardPage_container}>
                <h1 className={styles.boardPage_title}>{board.title}</h1>
                <div className={styles.boardPage_lists}>
                    {boardLists.map((list) => {
                        const cardsInList = cards.filter(
                            (card) => card.listId === list.id
                        );
                        return (
                            <BoardListComponent
                                key={list.id}
                                title={list.title}
                                cards={cardsInList}
                            />
                        );
                    })}
                </div>
                <LooseCardsPanel cards={looseCards} />
            </div>
        </div>
    );
}
