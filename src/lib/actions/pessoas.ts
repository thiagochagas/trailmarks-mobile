import { supabase } from "@/lib/supabase/client";
import type { Pessoa } from "@/lib/domain/types";
import { pessoaInputSchema } from "@/lib/validation/pessoa";
import type { ActionResult } from "./types";

interface LinhaPessoa {
  id: string;
  usuario_id: string;
  nome: string;
}

function paraPessoa(linha: LinhaPessoa): Pessoa {
  return { id: linha.id, usuarioId: linha.usuario_id, nome: linha.nome };
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

export async function listarPessoas(): Promise<ActionResult<Pessoa[]>> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .eq("usuario_id", user.id)
      .order("nome");
    if (error) return { ok: false, error: `Falha ao listar pessoas: ${error.message}` };
    return { ok: true, data: (data as LinhaPessoa[]).map(paraPessoa) };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao listar pessoas.") };
  }
}

export async function criarPessoa(nome: string): Promise<ActionResult<Pessoa>> {
  const parsed = pessoaInputSchema.safeParse({ nome });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("pessoas")
      .insert({ usuario_id: user.id, nome: parsed.data.nome })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Já existe uma pessoa com esse nome." };
      return { ok: false, error: `Falha ao criar pessoa: ${error.message}` };
    }
    return { ok: true, data: paraPessoa(data as LinhaPessoa) };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao criar pessoa.") };
  }
}

export async function excluirPessoa(id: string): Promise<ActionResult> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("pessoas")
      .delete()
      .eq("id", id)
      .eq("usuario_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: `Falha ao excluir pessoa: ${error.message}` };
    if (!data) return { ok: false, error: "Pessoa não encontrada." };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao excluir pessoa.") };
  }
}
