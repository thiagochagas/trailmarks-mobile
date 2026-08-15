import type { StatusViagem, InteresseViagem } from "./types";

export const LABEL_STATUS: Record<StatusViagem, string> = {
  realizada: "Já fui",
  planejada: "Planejada",
  desejo: "Quero ir",
};

export const LABEL_INTERESSE: Record<InteresseViagem, string> = {
  praia: "Praia",
  montanha: "Montanha",
  cultura: "Cultura",
  gastronomia: "Gastronomia",
  aventura: "Aventura",
  natureza: "Natureza",
  urbano: "Urbano",
  historia: "História",
};

export const LABEL_CONTINENTE: Record<string, string> = {
  Europe: "Europa",
  Asia: "Ásia",
  Africa: "África",
  Americas: "Américas",
  Oceania: "Oceania",
  Antarctic: "Antártida",
};
