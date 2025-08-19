import { z } from 'zod';

export const BoardListSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'List title is required'),
    description: z.string().optional(),
    position: z.number().int().min(0).optional(),
    boardId: z.string(),
    createdBy: z
        .object({
            userId: z.string(),
            name: z.string(),
            email: z.string(),
        })
        .optional(),
});

export type BoardListFormValues = z.infer<typeof BoardListSchema>;
