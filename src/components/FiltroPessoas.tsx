import { Pressable, ScrollView, Text, View } from "react-native";
import type { Pessoa } from "@/lib/domain/types";

export function FiltroPessoas({
  pessoas,
  selecionadas,
  onChange,
}: {
  pessoas: Pessoa[];
  selecionadas: string[];
  onChange: (ids: string[]) => void;
}) {
  if (pessoas.length === 0) return null;

  function alternar(id: string) {
    onChange(selecionadas.includes(id) ? selecionadas.filter((sid) => sid !== id) : [...selecionadas, id]);
  }

  return (
    <View className="flex-row items-center gap-2 pb-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-2">
        <Text className="text-xs text-muted-foreground">Filtrar:</Text>
        {pessoas.map((p) => {
          const ativo = selecionadas.includes(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => alternar(p.id)}
              className={`rounded-full border px-3 py-1.5 ${
                ativo ? "border-primary bg-primary" : "border-border bg-transparent"
              }`}
            >
              <Text className={`text-xs font-medium ${ativo ? "text-primary-foreground" : "text-foreground"}`}>
                {p.nome}
              </Text>
            </Pressable>
          );
        })}
        {selecionadas.length > 0 && (
          <Pressable onPress={() => onChange([])} className="px-2 py-1.5">
            <Text className="text-xs text-muted-foreground">Limpar</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
