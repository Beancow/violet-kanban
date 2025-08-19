import { z } from 'zod';

export const boardCardSchema = z.object({
    id: z.string().optional(), // id is usually generated
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.number().int().min(0).optional(),
    listId: z.string().nullable(),
    boardId: z.string(),
    organizationId: z.string(),
    completed: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    createdBy: z
        .object({
            userId: z.string(),
            name: z.string(),
            email: z.string(),
        })
        .optional(),
});

export type BoardCardSchema = typeof boardCardSchema;
