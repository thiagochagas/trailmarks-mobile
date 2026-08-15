import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SectionList, Text, View } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import type { Pessoa, Viagem } from "@/lib/domain/types";
import { listarViagens } from "@/lib/actions/viagens";
import { listarPessoas } from "@/lib/actions/pessoas";
import { ViagemCard } from "@/components/ViagemCard";
import { FiltroPessoas } from "@/components/FiltroPessoas";

export default function ViagensScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [pessoaIds, setPessoaIds] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (comIndicadorAtualizando = false, filtro: string[] = []) => {
    if (comIndicadorAtualizando) setAtualizando(true);
    const [resultadoViagens, resultadoPessoas] = await Promise.all([
      listarViagens(["realizada", "planejada"], filtro.length > 0 ? filtro : undefined),
      listarPessoas(),
    ]);
    if (resultadoViagens.ok && resultadoViagens.data) {
      setViagens(resultadoViagens.data);
      setErro(null);
    } else {
      setErro(resultadoViagens.error ?? "Falha ao carregar viagens.");
    }
    if (resultadoPessoas.ok && resultadoPessoas.data) setPessoas(resultadoPessoas.data);
    setCarregando(false);
    setAtualizando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar(false, pessoaIds);
    }, [carregar, pessoaIds])
  );

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const realizadas = viagens
    .filter((v) => v.status === "realizada")
    .sort((a, b) => (b.dataInicio ?? "").localeCompare(a.dataInicio ?? ""));
  const planejadas = viagens
    .filter((v) => v.status === "planejada")
    .sort((a, b) => (a.dataInicio ?? "9999").localeCompare(b.dataInicio ?? "9999"));

  return (
    <View className="flex-1 bg-background">
      <SectionList
        sections={[
          { title: "Já fui", data: realizadas, vazio: "Nenhuma viagem realizada ainda." },
          { title: "Planejadas", data: planejadas, vazio: "Nenhuma viagem planejada ainda." },
        ]}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => carregar(true, pessoaIds)} />
        }
        renderItem={({ item }) => (
          <View className="pb-2">
            <ViagemCard viagem={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <Text className="bg-background pb-2 pt-3 text-base font-semibold text-foreground">
            {section.title}
          </Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text className="pb-2 text-sm text-muted-foreground">{section.vazio}</Text>
          ) : null
        }
        ListHeaderComponent={
          <View>
            <FiltroPessoas pessoas={pessoas} selecionadas={pessoaIds} onChange={setPessoaIds} />
            {erro && <Text className="pb-2 text-sm text-destructive">{erro}</Text>}
          </View>
        }
        ListEmptyComponent={
          <Text className="pt-8 text-center text-sm text-muted-foreground">
            Você ainda não registrou nenhuma viagem.
          </Text>
        }
      />
      <Pressable
        onPress={() => router.push("/viagem/nova")}
        className="absolute bottom-6 right-6 size-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        <Plus size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
