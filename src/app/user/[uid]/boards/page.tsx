'use client';

import { useAppState } from '@/components/AppStateProvider';

export default function Page() {
    const { boards } = useAppState();

    return (
        <div>
            <h1>User Boards</h1>
            <p>Here you can view and manage your boards.</p>
            {boards.map((board) => (
                <div key={board.id}>
                    <h2>{board.title}</h2>
                    <p>{board.description}</p>
                </div>
            ))}
        </div>
    );
}
