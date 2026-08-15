import { supabase } from "@/lib/supabase/client";
import type { Pessoa, StatusViagem, Viagem } from "@/lib/domain/types";
import { viagemInputSchema, type ViagemInput } from "@/lib/validation/viagem";
import type { ActionResult } from "./types";

const BUCKET_FOTOS = "fotos-viagens";
const EXPIRACAO_URL_FOTO = 60 * 60; // 1 hora

interface LinhaViagem {
  id: string;
  usuario_id: string;
  status: StatusViagem;
  codigo_pais: string;
  nome_pais: string;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  avaliacao: number | null;
  observacoes: string | null;
  foto_path: string | null;
  criado_em: string;
  atualizado_em: string;
}

interface LinhaPessoa {
  id: string;
  usuario_id: string;
  nome: string;
}

function paraPessoa(linha: LinhaPessoa): Pessoa {
  return { id: linha.id, usuarioId: linha.usuario_id, nome: linha.nome };
}

function paraViagem(linha: LinhaViagem, pessoas: Pessoa[] = [], fotoUrl: string | null = null): Viagem {
  return {
    id: linha.id,
    usuarioId: linha.usuario_id,
    status: linha.status,
    codigoPais: linha.codigo_pais,
    nomePais: linha.nome_pais,
    cidade: linha.cidade,
    latitude: linha.latitude,
    longitude: linha.longitude,
    dataInicio: linha.data_inicio,
    dataFim: linha.data_fim,
    avaliacao: linha.avaliacao,
    observacoes: linha.observacoes,
    pessoas,
    fotoPath: linha.foto_path,
    fotoUrl,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  };
}

function paraColunas(input: ViagemInput) {
  return {
    status: input.status,
    codigo_pais: input.codigoPais,
    nome_pais: input.nomePais,
    cidade: input.cidade || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    data_inicio: input.dataInicio || null,
    data_fim: input.dataFim || null,
    avaliacao: input.avaliacao ?? null,
    observacoes: input.observacoes || null,
  };
}

async function usuarioAtual() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

function mensagemErro(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function pessoasPorViagens(userId: string, viagemIds: string[]): Promise<Map<string, Pessoa[]>> {
  const mapa = new Map<string, Pessoa[]>();
  if (viagemIds.length === 0) return mapa;

  const { data, error } = await supabase
    .from("viagem_pessoas")
    .select("viagem_id, pessoas(id, usuario_id, nome)")
    .eq("usuario_id", userId)
    .in("viagem_id", viagemIds);
  if (error) throw new Error(`Falha ao buscar pessoas das viagens: ${error.message}`);

  for (const linha of data as unknown as { viagem_id: string; pessoas: LinhaPessoa }[]) {
    const lista = mapa.get(linha.viagem_id) ?? [];
    lista.push(paraPessoa(linha.pessoas));
    mapa.set(linha.viagem_id, lista);
  }
  return mapa;
}

// Bucket privado — nunca guardamos a URL da foto, só o caminho no Storage.
// A URL assinada é gerada aqui, na hora de ler, e expira em EXPIRACAO_URL_FOTO.
async function resolverFotosUrls(paths: (string | null)[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const caminhos = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  if (caminhos.length === 0) return mapa;

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(caminhos, EXPIRACAO_URL_FOTO);
  if (error || !data) return mapa; // sem foto é melhor do que quebrar a tela inteira

  for (const item of data) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

export async function listarViagens(
  status?: StatusViagem | StatusViagem[],
  pessoaIds?: string[]
): Promise<ActionResult<Viagem[]>> {
  try {
    const user = await usuarioAtual();
    let query = supabase.from("viagens").select("*").eq("usuario_id", user.id);
    if (status) {
      query = query.in("status", Array.isArray(status) ? status : [status]);
    }
    const { data, error } = await query.order("data_inicio", { ascending: false, nullsFirst: false });
    if (error) return { ok: false, error: `Falha ao listar viagens: ${error.message}` };

    const linhas = data as LinhaViagem[];
    const [pessoasPorViagem, fotosUrls] = await Promise.all([
      pessoasPorViagens(user.id, linhas.map((l) => l.id)),
      resolverFotosUrls(linhas.map((l) => l.foto_path)),
    ]);
    let viagens = linhas.map((l) =>
      paraViagem(l, pessoasPorViagem.get(l.id) ?? [], l.foto_path ? (fotosUrls.get(l.foto_path) ?? null) : null)
    );

    if (pessoaIds && pessoaIds.length > 0) {
      viagens = viagens.filter((v) => pessoaIds.every((pid) => v.pessoas.some((p) => p.id === pid)));
    }
    return { ok: true, data: viagens };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao listar viagens.") };
  }
}

export async function buscarViagem(id: string): Promise<ActionResult<Viagem>> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("viagens")
      .select("*")
      .eq("id", id)
      .eq("usuario_id", user.id)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Viagem não encontrada." };

    const linha = data as LinhaViagem;
    const [pessoasPorViagem, fotosUrls] = await Promise.all([
      pessoasPorViagens(user.id, [linha.id]),
      resolverFotosUrls([linha.foto_path]),
    ]);
    return {
      ok: true,
      data: paraViagem(
        linha,
        pessoasPorViagem.get(linha.id) ?? [],
        linha.foto_path ? (fotosUrls.get(linha.foto_path) ?? null) : null
      ),
    };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao buscar viagem.") };
  }
}

export async function criarViagem(input: ViagemInput): Promise<ActionResult<{ id: string }>> {
  const parsed = viagemInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("viagens")
      .insert({ ...paraColunas(parsed.data), foto_path: parsed.data.fotoPath ?? null, usuario_id: user.id })
      .select("*")
      .single();
    if (error) return { ok: false, error: `Falha ao criar viagem: ${error.message}` };

    if (parsed.data.pessoaIds && parsed.data.pessoaIds.length > 0) {
      const { error: erroPessoas } = await supabase.from("viagem_pessoas").insert(
        parsed.data.pessoaIds.map((pessoaId) => ({
          viagem_id: data.id,
          pessoa_id: pessoaId,
          usuario_id: user.id,
        }))
      );
      if (erroPessoas) return { ok: false, error: `Falha ao associar pessoas à viagem: ${erroPessoas.message}` };
    }

    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao criar viagem.") };
  }
}

export async function atualizarViagem(id: string, input: ViagemInput): Promise<ActionResult> {
  const parsed = viagemInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  try {
    const user = await usuarioAtual();

    let fotoAntiga: string | null = null;
    if (parsed.data.fotoPath !== undefined) {
      const { data: atual } = await supabase
        .from("viagens")
        .select("foto_path")
        .eq("id", id)
        .eq("usuario_id", user.id)
        .maybeSingle();
      fotoAntiga = (atual as { foto_path: string | null } | null)?.foto_path ?? null;
    }

    const colunas: Record<string, unknown> = {
      ...paraColunas(parsed.data),
      atualizado_em: new Date().toISOString(),
    };
    if (parsed.data.fotoPath !== undefined) colunas.foto_path = parsed.data.fotoPath;

    const { data, error } = await supabase
      .from("viagens")
      .update(colunas)
      .eq("id", id)
      .eq("usuario_id", user.id)
      .select("*")
      .maybeSingle();
    if (error) return { ok: false, error: `Falha ao atualizar viagem: ${error.message}` };
    if (!data) return { ok: false, error: "Viagem não encontrada." };

    // Se a foto mudou (nova ou removida), apaga o arquivo antigo do Storage
    // pra não deixar lixo acumulando — melhor esforço, não trava a resposta.
    if (parsed.data.fotoPath !== undefined && fotoAntiga && fotoAntiga !== parsed.data.fotoPath) {
      await supabase.storage.from(BUCKET_FOTOS).remove([fotoAntiga]);
    }

    if (parsed.data.pessoaIds !== undefined) {
      const { error: erroLimpar } = await supabase
        .from("viagem_pessoas")
        .delete()
        .eq("viagem_id", id)
        .eq("usuario_id", user.id);
      if (erroLimpar) return { ok: false, error: `Falha ao atualizar pessoas da viagem: ${erroLimpar.message}` };

      if (parsed.data.pessoaIds.length > 0) {
        const { error: erroPessoas } = await supabase.from("viagem_pessoas").insert(
          parsed.data.pessoaIds.map((pessoaId) => ({
            viagem_id: id,
            pessoa_id: pessoaId,
            usuario_id: user.id,
          }))
        );
        if (erroPessoas) return { ok: false, error: `Falha ao associar pessoas à viagem: ${erroPessoas.message}` };
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao atualizar viagem.") };
  }
}

export async function excluirViagem(id: string): Promise<ActionResult> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("viagens")
      .delete()
      .eq("id", id)
      .eq("usuario_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: `Falha ao excluir viagem: ${error.message}` };
    if (!data) return { ok: false, error: "Viagem não encontrada." };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao excluir viagem.") };
  }
}

export async function paisesVisitados(): Promise<ActionResult<string[]>> {
  try {
    const user = await usuarioAtual();
    const { data, error } = await supabase
      .from("viagens")
      .select("codigo_pais")
      .eq("usuario_id", user.id)
      .eq("status", "realizada");
    if (error) return { ok: false, error: `Falha ao buscar países visitados: ${error.message}` };
    return {
      ok: true,
      data: Array.from(new Set((data as { codigo_pais: string }[]).map((d) => d.codigo_pais))),
    };
  } catch (err) {
    return { ok: false, error: mensagemErro(err, "Falha ao buscar países visitados.") };
  }
}
