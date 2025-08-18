# Replicating Drag-and-Drop Kanban Functionality

This guide explains how to implement the drag-and-drop Kanban board from the `kanban-ai` repo in another repo (e.g., `violet-kanban`). Both repos are assumed to be in the same root folder: `~/repos`.

## Directory Reference

-   `kanban-ai` source: `~/repos/kanban-ai/src/components/kanban/`
-   Target repo example: `~/repos/violet-kanban/src/components/kanban/`

## Component Structure and File Mapping

You will need to copy/adapt the following files:

1. **KanbanBoard** (`kanban-board.tsx`)
    - Manages columns, tasks, and drag state.
    - Entry point for the Kanban UI.
2. **KanbanColumn** (`kanban-column.tsx`)
    - Handles drag-over, drag-leave, and drop events for columns.
    - Receives props for drag state and task movement.
3. **KanbanCard** (`kanban-card.tsx`)
    - Implements drag start and drag end for individual cards.
    - Sets the dragged task ID when a card is picked up.

## Types and Utilities

-   Ensure you have the types for `Column` and `Task` (see `~/repos/kanban-ai/src/types/index.ts`).
-   Utility functions (e.g., `cn` for classnames) may be in `~/repos/kanban-ai/src/lib/utils.ts`.

## State Management

In `KanbanBoard`:

-   `columns`: Array of column objects (e.g., To Do, In Progress, Done).
-   `tasks`: Array of task objects, each with an `id`, `columnId`, `title`, etc.
-   `draggedTaskId`: ID of the currently dragged task (string or null).

Example:

```tsx
const [columns, setColumns] = useState<Column[]>(initialColumns);
const [tasks, setTasks] = useState<Task[]>(initialTasks);
const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
```

## Drag-and-Drop Logic (Native HTML5)

### KanbanCard

-   Add `draggable` to the card element.
-   On `dragStart`, call `setDraggedTaskId(task.id)` and set `e.dataTransfer.effectAllowed = "move"`.
-   On `dragEnd`, call `setDraggedTaskId(null)`.

Example:

```tsx
<Card draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    {/* ... */}
</Card>
```

### KanbanColumn

-   On `dragOver`, call `e.preventDefault()` and set a highlight state (e.g., `setIsOver(true)`).
-   On `dragLeave`, remove highlight (`setIsOver(false)`).
-   On `drop`, call `moveTask(draggedTaskId, column.id)` and clear drag state.

Example:

```tsx
<div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={isOver ? 'bg-primary/20' : 'bg-primary/5'}
>
    {/* ... */}
</div>
```

### KanbanBoard

-   Pass `moveTask`, `setDraggedTaskId`, and `draggedTaskId` as props to columns and cards.
-   `moveTask` updates the column of a task by its ID:

```tsx
const moveTask = (taskId: string, newColumnId: string) => {
    setTasks((prevTasks) =>
        prevTasks.map((task) =>
            task.id === taskId ? { ...task, columnId: newColumnId } : task
        )
    );
};
```

## Styling

-   Use Tailwind or your preferred CSS to visually indicate drag-over state (e.g., change background color of the column when a card is dragged over).
-   Example: `bg-primary/20` for highlight, `bg-primary/5` for default.

## Dependencies

-   No external drag-and-drop library required; uses native HTML5 drag events.
-   Ensure you have React and any UI libraries used (e.g., Tailwind, Lucide icons).

## Steps to Implement in `violet-kanban`

1. **Copy or create the following files in `~/repos/violet-kanban/src/components/kanban/`:**
    - `kanban-board.tsx`
    - `kanban-column.tsx`
    - `kanban-card.tsx`
2. **Copy or adapt types from `~/repos/kanban-ai/src/types/index.ts` to your target repo.**
3. **Copy or adapt any utility functions (e.g., `cn`) from `~/repos/kanban-ai/src/lib/utils.ts`.**
4. **Ensure your UI components (Card, Badge, etc.) are available or replaced as needed.**
5. **Test drag-and-drop between columns.**
6. **Refactor for your repo’s architecture and naming conventions.**

## Troubleshooting & Tips

-   If drag-and-drop does not work, check that:
    -   The card element is `draggable`.
    -   The column handles `onDragOver`, `onDrop`, and calls `e.preventDefault()`.
    -   The state for `draggedTaskId` is correctly set and cleared.
    -   The `moveTask` function updates the correct task.
-   If you use different UI libraries, adapt the JSX and props accordingly.
-   You may need to update import paths for types and utilities.

## Example Directory Structure

```
~/repos/kanban-ai/src/components/kanban/
    kanban-board.tsx
    kanban-column.tsx
    kanban-card.tsx
~/repos/kanban-ai/src/types/index.ts
~/repos/kanban-ai/src/lib/utils.ts

~/repos/violet-kanban/src/components/kanban/
    kanban-board.tsx
    kanban-column.tsx
    kanban-card.tsx
~/repos/violet-kanban/src/types/index.ts
~/repos/violet-kanban/src/lib/utils.ts
```

---

**Reference: Implementation from `kanban-ai` (August 2025)**
