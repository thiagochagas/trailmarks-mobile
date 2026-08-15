import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { CoberturaContinente } from "@/lib/domain/sugestoes";
import { LABEL_CONTINENTE } from "@/lib/domain/enums";

export function CoberturaLinha({ cobertura }: { cobertura: CoberturaContinente }) {
  const [aberto, setAberto] = useState(false);
  const pct = cobertura.total > 0 ? (cobertura.visitados / cobertura.total) * 100 : 0;

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">
          {LABEL_CONTINENTE[cobertura.continente] ?? cobertura.continente}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {cobertura.visitados} de {cobertura.total} países
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
        <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </View>
      {cobertura.faltantes.length > 0 && (
        <Pressable onPress={() => setAberto((v) => !v)}>
          <Text className="text-xs text-primary">{aberto ? "Ver menos" : "Ver mais"}</Text>
        </Pressable>
      )}
      {aberto && (
        <Text className="text-xs text-muted-foreground">
          {cobertura.faltantes
            .slice(0, 15)
            .map((p) => p.nomePt)
            .join(", ")}
          {cobertura.faltantes.length > 15 && ` e mais ${cobertura.faltantes.length - 15}...`}
        </Text>
      )}
    </View>
  );
}
