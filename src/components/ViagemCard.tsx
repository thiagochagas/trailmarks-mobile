import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";
import type { Viagem } from "@/lib/domain/types";
import { formatarIntervalo } from "@/lib/format";

export function ViagemCard({ viagem }: { viagem: Viagem }) {
  return (
    <Pressable
      onPress={() => router.push(`/viagem/${viagem.id}`)}
      className="flex-row gap-3 rounded-lg border border-border bg-card p-3"
    >
      {viagem.fotoUrl && (
        <Image
          source={{ uri: viagem.fotoUrl }}
          style={{ width: 56, height: 56, borderRadius: 8 }}
          contentFit="cover"
        />
      )}
      <View className="flex-1 gap-1">
        <Text className="font-medium text-foreground">
          {viagem.cidade ? `${viagem.cidade}, ` : ""}
          {viagem.nomePais}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {formatarIntervalo(viagem.dataInicio, viagem.dataFim)}
        </Text>
        {!!viagem.avaliacao && (
          <View className="flex-row gap-0.5 pt-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={14}
                color="#f97316"
                fill={n <= viagem.avaliacao! ? "#f97316" : "transparent"}
              />
            ))}
          </View>
        )}
        {viagem.pessoas.length > 0 && (
          <View className="flex-row flex-wrap gap-1 pt-1">
            {viagem.pessoas.slice(0, 2).map((p) => (
              <View key={p.id} className="rounded-full bg-secondary px-2 py-0.5">
                <Text className="text-[0.65rem] text-secondary-foreground">{p.nome}</Text>
              </View>
            ))}
            {viagem.pessoas.length > 2 && (
              <View className="rounded-full bg-secondary px-2 py-0.5">
                <Text className="text-[0.65rem] text-secondary-foreground">
                  +{viagem.pessoas.length - 2}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
