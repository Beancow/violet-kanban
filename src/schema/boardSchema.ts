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
    title: z.string().min(2, 'Board title must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
});

export type BoardFormValues = z.infer<typeof BoardSchema>;
