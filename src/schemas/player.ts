import { z } from 'zod';

export const playerSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(30, 'Nome deve ter no máximo 30 caracteres'),
});

export type PlayerFormData = z.infer<typeof playerSchema>;
