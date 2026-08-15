export type StatusViagem = "realizada" | "planejada" | "desejo";

export type InteresseViagem =
  | "praia"
  | "montanha"
  | "cultura"
  | "gastronomia"
  | "aventura"
  | "natureza"
  | "urbano"
  | "historia";

export const INTERESSES: InteresseViagem[] = [
  "praia",
  "montanha",
  "cultura",
  "gastronomia",
  "aventura",
  "natureza",
  "urbano",
  "historia",
];

export interface Viagem {
  id: string;
  usuarioId: string;
  status: StatusViagem;
  codigoPais: string;
  nomePais: string;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  avaliacao: number | null;
  observacoes: string | null;
  pessoas: Pessoa[];
  fotoPath: string | null;
  fotoUrl: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Pessoa {
  id: string;
  usuarioId: string;
  nome: string;
}

export interface Destino {
  id: string;
  codigoPais: string;
  nomePais: string;
  cidade: string | null;
  continente: string;
  tags: InteresseViagem[];
  descricao: string;
  melhorEpoca: string | null;
}

export interface Perfil {
  usuarioId: string;
  nome: string | null;
  interesses: InteresseViagem[];
}

export interface PaisRef {
  cca2: string;
  ccn3: string | null;
  nomePt: string;
  nomeEn: string;
  continente: string;
  latitude: number | null;
  longitude: number | null;
}
