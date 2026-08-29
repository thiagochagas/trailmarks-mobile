import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { listarViagens } from "@/lib/actions/viagens";
import { formatarIntervalo } from "@/lib/format";

interface FotoGaleria {
  id: string;
  url: string;
  cidade: string | null;
  nomePais: string;
  dataInicio: string | null;
  dataFim: string | null;
}

const COLUNAS = 3;
const ESPACO = 3;

export default function GaleriaScreen() {
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null);
  const { width } = useWindowDimensions();

  const carregar = useCallback(async () => {
    const resultado = await listarViagens();
    if (resultado.ok && resultado.data) {
      setFotos(
        resultado.data
          .filter((v): v is typeof v & { fotoUrl: string } => v.fotoUrl !== null)
          .map((v) => ({
            id: v.id,
            url: v.fotoUrl,
            cidade: v.cidade,
            nomePais: v.nomePais,
            dataInicio: v.dataInicio,
            dataFim: v.dataFim,
          }))
      );
      setErro(null);
    } else {
      setErro(resultado.error ?? "Falha ao carregar fotos.");
    }
    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const tamanhoItem = (width - ESPACO * (COLUNAS + 1)) / COLUNAS;

  return (
    <View className="flex-1 bg-background">
      {erro && <Text className="px-4 pt-2 text-sm text-destructive">{erro}</Text>}
      {fotos.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-sm text-muted-foreground">Nenhuma foto adicionada ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={fotos}
          keyExtractor={(item) => item.id}
          numColumns={COLUNAS}
          contentContainerStyle={{ padding: ESPACO }}
          columnWrapperStyle={{ gap: ESPACO }}
          ItemSeparatorComponent={() => <View style={{ height: ESPACO }} />}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setIndiceAberto(index)}>
              <Image
                source={{ uri: item.url }}
                style={{ width: tamanhoItem, height: tamanhoItem, borderRadius: 6 }}
                contentFit="cover"
              />
            </Pressable>
          )}
        />
      )}

      {indiceAberto !== null && (
        <VisualizadorFotos
          fotos={fotos}
          indiceInicial={indiceAberto}
          onFechar={() => setIndiceAberto(null)}
        />
      )}
    </View>
  );
}

// Navegação entre fotos por swipe (FlatList horizontal com paginação nativa)
// em vez de botões de seta como na web — é o gesto natural no celular.
function VisualizadorFotos({
  fotos,
  indiceInicial,
  onFechar,
}: {
  fotos: FotoGaleria[];
  indiceInicial: number;
  onFechar: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [indiceAtual, setIndiceAtual] = useState(indiceInicial);
  const atual = fotos[indiceAtual];

  function aoRolar(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const novoIndice = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndiceAtual(novoIndice);
  }

  return (
    <Modal visible animationType="fade" onRequestClose={onFechar}>
      <View className="flex-1 bg-black">
        <FlatList
          data={fotos}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={indiceInicial}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={aoRolar}
          renderItem={({ item }) => (
            <View style={{ width, height }} className="items-center justify-center">
              <Image
                source={{ uri: item.url }}
                style={{ width, height: height * 0.75 }}
                contentFit="contain"
              />
            </View>
          )}
        />

        <View
          className="absolute left-0 right-0 flex-row items-start justify-between px-4"
          style={{ top: insets.top + 8 }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-white">
              {atual?.cidade ? `${atual.cidade}, ` : ""}
              {atual?.nomePais}
            </Text>
            <Text className="text-xs text-white/70">
              {formatarIntervalo(atual?.dataInicio ?? null, atual?.dataFim ?? null)} ·{" "}
              {indiceAtual + 1} de {fotos.length}
            </Text>
          </View>
          <Pressable onPress={onFechar} className="rounded-full bg-white/10 p-2">
            <X size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
