import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Pessoa, Viagem } from "@/lib/domain/types";
import { listarViagens } from "@/lib/actions/viagens";
import { listarPessoas } from "@/lib/actions/pessoas";
import { TODOS_PAISES, paisesPorContinente } from "@/lib/domain/paises";
import { WorldMap, type MarcadorMapa } from "@/components/maps/WorldMap";
import { FiltroPessoas } from "@/components/FiltroPessoas";

export default function MapaScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [pessoaIds, setPessoaIds] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (filtro: string[] = []) => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar(pessoaIds);
    }, [carregar, pessoaIds])
  );

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const visitados = Array.from(
    new Set(viagens.filter((v) => v.status === "realizada").map((v) => v.codigoPais))
  );
  const continentePorCca2 = new Map(TODOS_PAISES.map((p) => [p.cca2, p.continente]));
  const totalContinentes = Object.keys(paisesPorContinente()).length;
  const continentesVisitados = new Set(
    visitados.map((cca2) => continentePorCca2.get(cca2)).filter(Boolean)
  ).size;

  const marcadores: MarcadorMapa[] = viagens
    .filter((v): v is Viagem & { latitude: number; longitude: number } => v.latitude !== null && v.longitude !== null)
    .filter((v): v is typeof v & { status: "realizada" | "planejada" } =>
      v.status === "realizada" || v.status === "planejada"
    )
    .map((v) => ({
      id: v.id,
      cidade: v.cidade,
      nomePais: v.nomePais,
      latitude: v.latitude,
      longitude: v.longitude,
      status: v.status,
      dataInicio: v.dataInicio,
      dataFim: v.dataFim,
      observacoes: v.observacoes,
      fotoUrl: v.fotoUrl,
    }));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 p-4">
      <Text className="text-sm text-muted-foreground">
        Você já visitou <Text className="font-semibold text-foreground">{visitados.length}</Text>{" "}
        {visitados.length === 1 ? "país" : "países"} em{" "}
        <Text className="font-semibold text-foreground">{continentesVisitados}</Text> de{" "}
        {totalContinentes} continentes.
      </Text>
      <FiltroPessoas pessoas={pessoas} selecionadas={pessoaIds} onChange={setPessoaIds} />
      {erro && <Text className="text-sm text-destructive">{erro}</Text>}
      <WorldMap paisesVisitados={visitados} marcadores={marcadores} largura={330} altura={220} />
    </ScrollView>
  );
}
