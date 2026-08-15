import { z } from "zod";

export const pessoaInputSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),
});

export type PessoaInput = z.infer<typeof pessoaInputSchema>;
