import type { Destino, InteresseViagem, PaisRef, Viagem } from "./types";

export function sugerirPorInteresse(
  destinos: Destino[],
  interesses: InteresseViagem[],
  viagens: Viagem[]
): Destino[] {
  const paisesJaVisitados = new Set(
    viagens.filter((v) => v.status === "realizada").map((v) => v.codigoPais)
  );
  const candidatos = destinos.filter((d) => !paisesJaVisitados.has(d.codigoPais));

  if (interesses.length === 0) return candidatos;

  return candidatos
    .map((d) => ({ destino: d, score: d.tags.filter((t) => interesses.includes(t)).length }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((c) => c.destino);
}

export interface CoberturaContinente {
  continente: string;
  total: number;
  visitados: number;
  faltantes: PaisRef[];
}

export function cobrirPorContinente(
  paises: PaisRef[],
  paisesVisitados: string[]
): CoberturaContinente[] {
  const visitados = new Set(paisesVisitados);
  const porContinente = new Map<string, PaisRef[]>();
  for (const pais of paises) {
    const lista = porContinente.get(pais.continente) ?? [];
    lista.push(pais);
    porContinente.set(pais.continente, lista);
  }

  return Array.from(porContinente.entries())
    .map(([continente, lista]) => {
      const faltantes = lista.filter((p) => !visitados.has(p.cca2));
      return {
        continente,
        total: lista.length,
        visitados: lista.length - faltantes.length,
        faltantes,
      };
    })
    .sort((a, b) => a.continente.localeCompare(b.continente));
}
