import { z } from 'zod';

export const BoardListSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    position: z.number(),
});

export const BoardCardSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.number().optional(),
    listId: z.string(),
    completed: z.boolean().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const BoardSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    lists: z.array(BoardListSchema),
    cards: z.array(BoardCardSchema),
});
