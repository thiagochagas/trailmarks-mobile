import { supabase } from "@/lib/supabase/client";
import type { InteresseViagem, Perfil } from "@/lib/domain/types";
import type { ActionResult } from "./types";

interface LinhaPerfil {
  usuario_id: string;
  nome: string | null;
  interesses: InteresseViagem[];
}

function paraPerfil(linha: LinhaPerfil): Perfil {
  return { usuarioId: linha.usuario_id, nome: linha.nome, interesses: linha.interesses };
}

function mensagemErro(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function usuarioAtual() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function obterOuCriarPerfil(): Promise<ActionResult<Perfil>> {
  try {
    const user = await usuarioAtual();
    const { data } = await supabase
      .from("perfis")
      .select("*")
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (data) return { ok: true, data: paraPerfil(data as LinhaPerfil) };

    const { data: criado, error } = await supabase
      .from("perfis")
      .insert({ usuario_id: user.id, interesses: [] })
      .select("*")
      .single();
    if (error) return { ok: false, error: `Falha ao criar perfil: ${error.message}` };
    return { ok: true, data: paraPerfil(criado as LinhaPerfil) };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao obter perfil.") };
  }
}

export async function atualizarInteresses(interesses: InteresseViagem[]): Promise<ActionResult<Perfil>> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("perfis")
      .upsert({ usuario_id: user.id, interesses, atualizado_em: new Date().toISOString() })
      .select("*")
      .single();
    if (error) return { ok: false, error: `Falha ao atualizar interesses: ${error.message}` };
    return { ok: true, data: paraPerfil(data as LinhaPerfil) };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao atualizar interesses.") };
  }
}
