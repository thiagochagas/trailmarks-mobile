import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Destino, InteresseViagem, Perfil, Viagem } from "@/lib/domain/types";
import { INTERESSES } from "@/lib/domain/types";
import { LABEL_INTERESSE, LABEL_CONTINENTE } from "@/lib/domain/enums";
import { TODOS_PAISES, paisPorCca2 } from "@/lib/domain/paises";
import { sugerirPorInteresse, cobrirPorContinente } from "@/lib/domain/sugestoes";
import { obterOuCriarPerfil, atualizarInteresses } from "@/lib/actions/perfil";
import { listarDestinos } from "@/lib/actions/destinos";
import { listarViagens, criarViagem, excluirViagem } from "@/lib/actions/viagens";
import { CoberturaLinha } from "@/components/CoberturaLinha";
import { WishlistForm } from "@/components/forms/WishlistForm";
import { confirmar } from "@/lib/confirm";

type Aba = "para-voce" | "cobertura" | "wishlist";

const ABAS: { valor: Aba; label: string }[] = [
  { valor: "para-voce", label: "Para você" },
  { valor: "cobertura", label: "Cobertura" },
  { valor: "wishlist", label: "Wishlist" },
];

export default function SugestoesScreen() {
  const [aba, setAba] = useState<Aba>("para-voce");
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemEditando, setItemEditando] = useState<Viagem | undefined>(undefined);

  const carregar = useCallback(async () => {
    const [rPerfil, rDestinos, rViagens] = await Promise.all([
      obterOuCriarPerfil(),
      listarDestinos(),
      listarViagens(),
    ]);
    if (rPerfil.ok && rPerfil.data) setPerfil(rPerfil.data);
    if (rDestinos.ok && rDestinos.data) setDestinos(rDestinos.data);
    if (rViagens.ok && rViagens.data) setViagens(rViagens.data);
    const primeiroErro = !rPerfil.ok ? rPerfil.error : !rDestinos.ok ? rDestinos.error : !rViagens.ok ? rViagens.error : null;
    setErro(primeiroErro ?? null);
    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function alternarInteresse(tag: InteresseViagem) {
    if (!perfil) return;
    const atualizados = perfil.interesses.includes(tag)
      ? perfil.interesses.filter((t) => t !== tag)
      : [...perfil.interesses, tag];
    setPerfil({ ...perfil, interesses: atualizados });
    const resultado = await atualizarInteresses(atualizados);
    if (!resultado.ok) setErro(resultado.error ?? "Falha ao atualizar interesses.");
  }

  async function adicionarNaWishlist(destino: Destino) {
    const resultado = await criarViagem({
      status: "desejo",
      codigoPais: destino.codigoPais,
      nomePais: destino.nomePais,
      cidade: destino.cidade ?? undefined,
      observacoes: destino.descricao,
    });
    if (!resultado.ok) {
      setErro(resultado.error ?? "Falha ao adicionar à wishlist.");
      return;
    }
    carregar();
  }

  function removerDaWishlist(id: string) {
    confirmar("Remover da wishlist?", "Essa ação não pode ser desfeita.", async () => {
      const resultado = await excluirViagem(id);
      if (!resultado.ok) {
        setErro(resultado.error ?? "Falha ao remover.");
        return;
      }
      carregar();
    });
  }

  if (carregando || !perfil) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const visitados = viagens.filter((v) => v.status === "realizada").map((v) => v.codigoPais);
  const sugeridos = sugerirPorInteresse(destinos, perfil.interesses, viagens);
  const cobertura = cobrirPorContinente(TODOS_PAISES, visitados);
  const wishlistPorContinente = (() => {
    const itens = viagens.filter((v) => v.status === "desejo");
    const grupos = new Map<string, Viagem[]>();
    for (const v of itens) {
      const continente = paisPorCca2(v.codigoPais)?.continente ?? "Outro";
      const lista = grupos.get(continente) ?? [];
      lista.push(v);
      grupos.set(continente, lista);
    }
    for (const lista of grupos.values()) {
      lista.sort((a, b) => a.nomePais.localeCompare(b.nomePais, "pt-BR"));
    }
    return Array.from(grupos.entries()).sort((a, b) =>
      (LABEL_CONTINENTE[a[0]] ?? a[0]).localeCompare(LABEL_CONTINENTE[b[0]] ?? b[0], "pt-BR")
    );
  })();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row border-b border-border">
        {ABAS.map((a) => (
          <Pressable
            key={a.valor}
            onPress={() => setAba(a.valor)}
            className={`flex-1 items-center py-3 ${aba === a.valor ? "border-b-2 border-primary" : ""}`}
          >
            <Text
              className={`text-sm font-medium ${
                aba === a.valor ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {erro && <Text className="px-4 pt-2 text-sm text-destructive">{erro}</Text>}

      {aba === "para-voce" && (
        <ScrollView contentContainerClassName="gap-3 p-4">
          <View className="flex-row flex-wrap gap-2">
            {INTERESSES.map((tag) => {
              const ativo = perfil.interesses.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => alternarInteresse(tag)}
                  className={`rounded-full border px-3 py-1.5 ${
                    ativo ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      ativo ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {LABEL_INTERESSE[tag]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {perfil.interesses.length === 0 && (
            <Text className="text-sm text-muted-foreground">
              Escolha alguns interesses acima para receber sugestões personalizadas.
            </Text>
          )}
          {sugeridos.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Nenhuma sugestão encontrada com esses interesses.
            </Text>
          ) : (
            sugeridos.map((d) => (
              <View key={d.id} className="gap-1.5 rounded-lg border border-border bg-card p-3">
                <Text className="font-medium text-foreground">
                  {d.cidade ? `${d.cidade}, ` : ""}
                  {d.nomePais}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {LABEL_CONTINENTE[d.continente] ?? d.continente}
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {d.tags.slice(0, 3).map((t) => (
                    <View key={t} className="rounded-full bg-secondary px-2 py-0.5">
                      <Text className="text-[0.65rem] text-secondary-foreground">
                        {LABEL_INTERESSE[t]}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="text-sm text-foreground" numberOfLines={2}>
                  {d.descricao}
                </Text>
                <Pressable
                  onPress={() => adicionarNaWishlist(d)}
                  className="mt-1 self-start rounded-md border border-border px-3 py-1.5"
                >
                  <Text className="text-xs font-medium text-foreground">+ Adicionar à wishlist</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {aba === "cobertura" && (
        <ScrollView contentContainerClassName="gap-4 p-4">
          {cobertura.map((c) => (
            <CoberturaLinha key={c.continente} cobertura={c} />
          ))}
        </ScrollView>
      )}

      {aba === "wishlist" && (
        <ScrollView contentContainerClassName="gap-3 p-4">
          <Pressable
            onPress={() => {
              setItemEditando(undefined);
              setModalVisivel(true);
            }}
            className="self-start rounded-md bg-primary px-3 py-2"
          >
            <Text className="text-sm font-medium text-primary-foreground">+ Adicionar</Text>
          </Pressable>
          {wishlistPorContinente.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Sua wishlist está vazia.</Text>
          ) : (
            wishlistPorContinente.map(([continente, itens]) => (
              <View key={continente} className="gap-2">
                <Text className="text-sm font-semibold text-muted-foreground">
                  {LABEL_CONTINENTE[continente] ?? continente}
                </Text>
                {itens.map((v) => (
                  <View key={v.id} className="gap-1.5 rounded-lg border border-border bg-card p-3">
                    <Text className="font-medium text-foreground">
                      {v.cidade ? `${v.cidade}, ` : ""}
                      {v.nomePais}
                    </Text>
                    {v.observacoes && (
                      <Text className="text-sm text-muted-foreground">{v.observacoes}</Text>
                    )}
                    <View className="flex-row gap-4 pt-1">
                      <Pressable
                        onPress={() => {
                          setItemEditando(v);
                          setModalVisivel(true);
                        }}
                      >
                        <Text className="text-sm text-primary">Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => removerDaWishlist(v.id)}>
                        <Text className="text-sm text-destructive">Remover</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <WishlistForm
        visivel={modalVisivel}
        item={itemEditando}
        onFechar={() => setModalVisivel(false)}
        onSalvo={() => {
          setModalVisivel(false);
          carregar();
        }}
      />
    </View>
  );
}
