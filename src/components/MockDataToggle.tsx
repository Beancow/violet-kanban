import { useState, useEffect } from 'react';
import { mockBoards } from '@/mock/mockData';
import type { Board } from '@/types/appState.type';

export default function MockDataToggle({
    onSetBoards,
}: {
    onSetBoards: (boards: Board[]) => void;
}) {
    const [useMock, setUseMock] = useState(false);

    useEffect(() => {
        if (useMock) {
            onSetBoards(mockBoards);
        } else {
            // Replace with your server fetch logic
            fetchBoardsFromServer().then(onSetBoards);
        }
    }, [useMock, onSetBoards]);

    return (
        <div style={{ marginBottom: 16 }}>
            <button onClick={() => setUseMock(true)}>Load Mock Data</button>
            <button onClick={() => setUseMock(false)}>Load Server Data</button>
        </div>
    );
}

// Dummy server fetch function for illustration
async function fetchBoardsFromServer() {
    // Replace with your actual fetch logic
    return [];
}
