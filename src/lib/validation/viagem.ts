import { z } from "zod";

export const viagemInputSchema = z
  .object({
    status: z.enum(["realizada", "planejada", "desejo"]),
    codigoPais: z.string().length(2),
    nomePais: z.string().min(1),
    cidade: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    avaliacao: z.number().int().min(1).max(5).optional(),
    observacoes: z.string().optional(),
    pessoaIds: z.array(z.string()).optional(),
    fotoPath: z.string().nullable().optional(),
  })
  .refine((v) => (v.latitude === undefined) === (v.longitude === undefined), {
    message: "Latitude e longitude precisam ser preenchidas juntas.",
    path: ["longitude"],
  })
  .refine((v) => v.status !== "realizada" || !!v.dataInicio, {
    message: "Viagens já realizadas precisam de uma data de início.",
    path: ["dataInicio"],
  })
  .refine((v) => !v.dataFim || !v.dataInicio || v.dataFim >= v.dataInicio, {
    message: "A data final não pode ser anterior à data inicial.",
    path: ["dataFim"],
  });

export type ViagemInput = z.infer<typeof viagemInputSchema>;
