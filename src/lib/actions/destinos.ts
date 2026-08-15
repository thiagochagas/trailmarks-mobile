import { supabase } from "@/lib/supabase/client";
import type { Destino } from "@/lib/domain/types";
import type { ActionResult } from "./types";

interface LinhaDestino {
  id: string;
  codigo_pais: string;
  nome_pais: string;
  cidade: string | null;
  continente: string;
  tags: Destino["tags"];
  descricao: string;
  melhor_epoca: string | null;
}

function paraDestino(linha: LinhaDestino): Destino {
  return {
    id: linha.id,
    codigoPais: linha.codigo_pais,
    nomePais: linha.nome_pais,
    cidade: linha.cidade,
    continente: linha.continente,
    tags: linha.tags,
    descricao: linha.descricao,
    melhorEpoca: linha.melhor_epoca,
  };
}

export async function listarDestinos(): Promise<ActionResult<Destino[]>> {
  try {
    const { data, error } = await supabase.from("destinos").select("*");
    if (error) return { ok: false, error: `Falha ao listar destinos: ${error.message}` };
    return { ok: true, data: (data as LinhaDestino[]).map(paraDestino) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha ao listar destinos." };
  }
}
