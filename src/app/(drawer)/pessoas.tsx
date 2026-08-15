import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Pessoa } from "@/lib/domain/types";
import { listarPessoas, criarPessoa, excluirPessoa } from "@/lib/actions/pessoas";
import { confirmar } from "@/lib/confirm";

export default function PessoasScreen() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const resultado = await listarPessoas();
    if (resultado.ok && resultado.data) {
      setPessoas(resultado.data);
      setErro(null);
    } else {
      setErro(resultado.error ?? "Falha ao carregar pessoas.");
    }
    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function adicionar() {
    if (!nome.trim()) return;
    setSalvando(true);
    setErro(null);
    const resultado = await criarPessoa(nome);
    if (!resultado.ok || !resultado.data) {
      setErro(resultado.error ?? "Falha ao adicionar pessoa.");
      setSalvando(false);
      return;
    }
    setPessoas((prev) => [...prev, resultado.data!].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
    setNome("");
    setSalvando(false);
  }

  function remover(pessoa: Pessoa) {
    confirmar(
      `Remover "${pessoa.nome}"?`,
      "Ela deixará de aparecer nas viagens já marcadas com ela.",
      async () => {
        setExcluindoId(pessoa.id);
        const resultado = await excluirPessoa(pessoa.id);
        if (!resultado.ok) {
          setErro(resultado.error ?? "Falha ao remover pessoa.");
          setExcluindoId(null);
          return;
        }
        setPessoas((prev) => prev.filter((p) => p.id !== pessoa.id));
        setExcluindoId(null);
      }
    );
  }

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="flex-row gap-2">
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome da pessoa (ex.: Eu, Esposa)"
          className="flex-1 rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
        />
        <Pressable
          onPress={adicionar}
          disabled={salvando || !nome.trim()}
          className="items-center justify-center rounded-md bg-primary px-4 disabled:opacity-50"
        >
          <Text className="font-medium text-primary-foreground">
            {salvando ? "..." : "Adicionar"}
          </Text>
        </Pressable>
      </View>

      {erro && <Text className="pt-2 text-sm text-destructive">{erro}</Text>}

      <FlatList
        data={pessoas}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 pt-4"
        ListEmptyComponent={
          <Text className="pt-4 text-sm text-muted-foreground">Nenhuma pessoa cadastrada ainda.</Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
            <Text className="font-medium text-foreground">{item.nome}</Text>
            <Pressable onPress={() => remover(item)} disabled={excluindoId === item.id}>
              <Text className="text-sm text-destructive">
                {excluindoId === item.id ? "Removendo..." : "Remover"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
