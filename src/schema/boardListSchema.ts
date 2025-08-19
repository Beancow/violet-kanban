import { z } from 'zod';

export const BoardListSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'List title is required'),
    description: z.string().optional(),
    position: z.number().int().min(0).optional(),
    boardId: z.string(),
});

export type BoardListFormValues = z.infer<typeof BoardListSchema>;
