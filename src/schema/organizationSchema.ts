import { z } from 'zod';

export const OrganizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    orgType: z.enum(['personal', 'company', 'private']),
    companyName: z.string().optional(),
    companyWebsite: z
        .union([z.url('Company website must be a valid URL'), z.literal('')])
        .optional(),
    logoURL: z
        .union([z.url('Logo URL must be a valid URL'), z.literal('')])
        .optional(),
});
