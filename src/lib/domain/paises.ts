import paisesData from "./paises-data.json";
import type { PaisRef } from "./types";

export const TODOS_PAISES: PaisRef[] = paisesData;

const porCca2 = new Map(TODOS_PAISES.map((p) => [p.cca2, p]));
const ccn3ParaCca2 = new Map(
  TODOS_PAISES.filter((p) => p.ccn3).map((p) => [p.ccn3 as string, p.cca2])
);

export function paisPorCca2(cca2: string): PaisRef | undefined {
  return porCca2.get(cca2);
}

export function ccn3PorCca2(cca2: string): string | undefined {
  return porCca2.get(cca2)?.ccn3 ?? undefined;
}

export function cca2PorCcn3(ccn3: string): string | undefined {
  return ccn3ParaCca2.get(ccn3);
}

export function paisesPorContinente(): Record<string, PaisRef[]> {
  const grupos: Record<string, PaisRef[]> = {};
  for (const pais of TODOS_PAISES) {
    (grupos[pais.continente] ??= []).push(pais);
  }
  return grupos;
}
