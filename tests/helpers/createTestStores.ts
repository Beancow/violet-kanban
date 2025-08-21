import { createCardStore } from '../../src/store/cardStore';
import { createListStore } from '../../src/store/listStore';
import { createBoardStore } from '../../src/store/boardStore';
import { createQueueStore } from '../../src/store/queueStore';
import { createTempIdMapStore } from '../../src/store/tempIdMapStore';

export function createTestStores() {
    const cardStore = createCardStore(false);
    const listStore = createListStore(false);
    const boardStore = createBoardStore(false);
    const tempMap = createTempIdMapStore(false);
    const queue = createQueueStore(false, { cardStore, listStore, boardStore });

    return { cardStore, listStore, boardStore, tempMap, queue };
}
