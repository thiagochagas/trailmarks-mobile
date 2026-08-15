import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarData(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatarIntervalo(inicio: string | null, fim: string | null): string {
  if (!inicio) return "Sem data definida";
  if (!fim || fim === inicio) return formatarData(inicio);
  return `${formatarData(inicio)} – ${formatarData(fim)}`;
}
