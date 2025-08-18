'use client';
import { useParams } from 'next/navigation';
import { useData } from '@/contexts/DataProvider';
import { BoardListComponent } from '@/components/BoardList';
import styles from './BoardPage.module.css';

export default function BoardPage() {
    const { boardId } = useParams();
    const { boards, lists, cards } = useData();

    const board = boards.find((b) => b.id === boardId);
    if (!board) return <div>Board not found.</div>;

    const boardLists = lists.filter((list) => list.boardId === boardId);

    return (
        <div className={styles.boardPage}>
            <div className={styles.boardPage__container}>
                <h1 className={styles.boardPage__title}>{board.title}</h1>
                <div className={styles.boardPage__lists}>
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
            </div>
        </div>
    );
}
