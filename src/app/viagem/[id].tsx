import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Viagem } from "@/lib/domain/types";
import { buscarViagem } from "@/lib/actions/viagens";
import { ViagemForm } from "@/components/forms/ViagemForm";

export default function EditarViagemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarViagem(id).then((resultado) => {
      if (!resultado.ok || !resultado.data) {
        setErro(resultado.error ?? "Viagem não encontrada.");
      } else {
        setViagem(resultado.data);
      }
      setCarregando(false);
    });
  }, [id]);

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (erro || !viagem) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-sm text-destructive">{erro ?? "Viagem não encontrada."}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ViagemForm viagem={viagem} />
    </View>
  );
}
