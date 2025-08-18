import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useData } from '@/contexts/DataProvider';
import styles from './BoardList.module.css';

type BoardListComponentProps = {
    title: string;
    cards: { id: string; title: string }[];
    onCardOrderChange?: (newOrder: string[]) => void;
};

export function BoardListComponent({
    title,
    cards,
    onCardOrderChange,
}: BoardListComponentProps) {
    const [items, setItems] = useState(cards.map((card) => card.id));

    return (
        <div className={styles.listContainer}>
            <h2 className={styles.listTitle}>{title}</h2>
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                    const { active, over } = event;
                    if (active.id !== over?.id) return;
                    const oldIndex = items.indexOf(String(active.id));
                    const newIndex = items.indexOf(String(over.id));
                    const newOrder = arrayMove(items, oldIndex, newIndex);
                    setItems(newOrder);
                    onCardOrderChange?.(newOrder); // Call provider/reducer to persist
                }}
            >
                <SortableContext items={items}>
                    <div className={styles.cardsColumn}>
                        {cards.map((card) => (
                            <SortableCard
                                key={card.id}
                                id={card.id}
                                card={card}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

type SortableCardProps = {
    id: string;
    card: { id: string; title: string };
};

function SortableCard({ id, card }: SortableCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            className={styles.card}
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
                transition,
            }}
            {...attributes}
            {...listeners}
        >
            {card.title}
        </div>
    );
}
