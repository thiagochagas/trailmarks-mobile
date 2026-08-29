import { Fragment, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { X, ZoomIn } from "lucide-react-native";
import { ccn3PorCca2 } from "@/lib/domain/paises";
import { formatarIntervalo } from "@/lib/format";
import { criarProjecao, paisesFeatures } from "@/lib/map/projection";

export interface MarcadorMapa {
  id: string;
  cidade: string | null;
  nomePais: string;
  latitude: number;
  longitude: number;
  status: "realizada" | "planejada" | "desejo";
  dataInicio: string | null;
  dataFim: string | null;
  observacoes: string | null;
  fotoUrl?: string | null;
}

interface WorldMapProps {
  paisesVisitados: string[];
  marcadores: MarcadorMapa[];
  largura?: number;
  altura?: number;
  escala?: number;
  centro?: [number, number];
  interativo?: boolean;
}

const CORES = {
  visitado: "#2563eb",
  naoVisitado: "#e5e5e5",
  borda: "#d4d4d4",
  realizada: "#f97316",
  planejada: "#7c3aed",
  desejo: "#f59e0b",
};

const ZOOM_MAXIMO = 6;

function estrelaPath(cx: number, cy: number, raioExterno: number, raioInterno: number): string {
  const pontas = 5;
  const passo = Math.PI / pontas;
  let rotacao = -Math.PI / 2;
  let d = "";
  for (let i = 0; i < pontas; i++) {
    const xExt = cx + Math.cos(rotacao) * raioExterno;
    const yExt = cy + Math.sin(rotacao) * raioExterno;
    d += i === 0 ? `M ${xExt} ${yExt}` : ` L ${xExt} ${yExt}`;
    rotacao += passo;
    const xInt = cx + Math.cos(rotacao) * raioInterno;
    const yInt = cy + Math.sin(rotacao) * raioInterno;
    d += ` L ${xInt} ${yInt}`;
    rotacao += passo;
  }
  return `${d} Z`;
}

export function WorldMap({
  paisesVisitados,
  marcadores,
  largura = 340,
  altura = 200,
  escala = 55,
  centro,
  interativo = true,
}: WorldMapProps) {
  const [selecionado, setSelecionado] = useState<MarcadorMapa | null>(null);

  const { path, projection } = useMemo(
    () => criarProjecao(largura, altura, escala, centro),
    [largura, altura, escala, centro]
  );

  const visitadosCcn3 = useMemo(
    () => new Set(paisesVisitados.map(ccn3PorCca2).filter((v): v is string => Boolean(v))),
    [paisesVisitados]
  );

  const features = paisesFeatures();

  const marcadoresProjetados = useMemo(() => {
    return marcadores
      .map((m) => {
        const ponto = projection([m.longitude, m.latitude]);
        if (!ponto) return null;
        return { marcador: m, x: ponto[0], y: ponto[1] };
      })
      .filter((v): v is { marcador: MarcadorMapa; x: number; y: number } => v !== null);
  }, [marcadores, projection]);

  // Zoom (pinça) e arrastar (pan) — pins próximos uns dos outros (ex.: várias
  // viagens na Europa) ficam sobrepostos na visão do mundo inteiro; dar zoom
  // é o jeito de afastá-los visualmente pra conseguir tocar no certo.
  const escalaAtual = useSharedValue(1);
  const escalaBase = useSharedValue(1);
  const deslocX = useSharedValue(0);
  const deslocY = useSharedValue(0);
  const deslocXBase = useSharedValue(0);
  const deslocYBase = useSharedValue(0);

  function limitar(valor: number, min: number, max: number) {
    "worklet";
    return Math.min(Math.max(valor, min), max);
  }

  const gestoPinca = Gesture.Pinch()
    .onUpdate((e) => {
      escalaAtual.value = limitar(escalaBase.value * e.scale, 1, ZOOM_MAXIMO);
    })
    .onEnd(() => {
      escalaBase.value = escalaAtual.value;
    });

  const gestoArrastar = Gesture.Pan()
    .minDistance(10)
    .onUpdate((e) => {
      deslocX.value = deslocXBase.value + e.translationX;
      deslocY.value = deslocYBase.value + e.translationY;
    })
    .onEnd(() => {
      deslocXBase.value = deslocX.value;
      deslocYBase.value = deslocY.value;
    });

  const gestoDuploToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      escalaAtual.value = withTiming(1);
      escalaBase.value = 1;
      deslocX.value = withTiming(0);
      deslocY.value = withTiming(0);
      deslocXBase.value = 0;
      deslocYBase.value = 0;
    });

  // O toque simples precisa ser um gesto próprio (não o onPress nativo do
  // <Circle>) porque o GestureDetector do zoom/pan intercepta o toque antes
  // do sistema de touch responder clássico do react-native-svg conseguir
  // reagir — por isso calculamos aqui manualmente qual pin foi tocado.
  // A tolerância encolhe conforme o zoom aumenta, já que dar zoom afasta os
  // pins na tela mas não muda a distância entre eles no espaço do SVG.
  const gestoToqueSimples = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      "worklet";
      const tolerancia = 18 / escalaAtual.value;
      let maisProximo: MarcadorMapa | null = null;
      let menorDistancia = tolerancia;
      for (let i = 0; i < marcadoresProjetados.length; i++) {
        const info = marcadoresProjetados[i];
        const dx = e.x - info.x;
        const dy = e.y - info.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia <= menorDistancia) {
          menorDistancia = distancia;
          maisProximo = info.marcador;
        }
      }
      if (maisProximo) {
        runOnJS(setSelecionado)(maisProximo);
      }
    });

  const gestos = Gesture.Race(
    Gesture.Exclusive(gestoDuploToque, gestoToqueSimples),
    Gesture.Simultaneous(gestoPinca, gestoArrastar)
  );

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [
      { translateX: deslocX.value },
      { translateY: deslocY.value },
      { scale: escalaAtual.value },
    ],
  }));

  const mapaSvg = (
    <Svg width={largura} height={altura}>
      {features.map((feat, indice) => {
        const visitado = visitadosCcn3.has(String(feat.id));
        const d = path(feat);
        if (!d) return null;
        return (
          <Path
            key={`${feat.id ?? "sem-id"}-${indice}`}
            d={d}
            fill={visitado ? CORES.visitado : CORES.naoVisitado}
            stroke={CORES.borda}
            strokeWidth={0.5}
          />
        );
      })}
      {marcadoresProjetados.map(({ marcador, x, y }) => {
        const cor = CORES[marcador.status];
        return (
          <Fragment key={marcador.id}>
            {marcador.status === "desejo" ? (
              <Path d={estrelaPath(x, y, 3.2, 1.3)} fill={cor} stroke="#fff" strokeWidth={0.75} />
            ) : (
              <Circle cx={x} cy={y} r={2.5} fill={cor} stroke="#fff" strokeWidth={1} />
            )}
          </Fragment>
        );
      })}
    </Svg>
  );

  return (
    <View>
      <View className="overflow-hidden rounded-lg border border-border bg-card">
        {interativo ? (
          <GestureDetector gesture={gestos}>
            <Animated.View style={estiloAnimado}>{mapaSvg}</Animated.View>
          </GestureDetector>
        ) : (
          mapaSvg
        )}
      </View>

      {interativo && (
        <View className="flex-row flex-wrap items-center gap-3 pt-2">
          <Legenda cor={CORES.visitado} label="País visitado" />
          <Legenda cor={CORES.naoVisitado} label="Não visitado" />
          <Legenda cor={CORES.realizada} label="Já fui" />
          <Legenda cor={CORES.planejada} label="Planejada" />
          <Legenda cor={CORES.desejo} label="Quero ir" />
          <View className="flex-row items-center gap-1">
            <ZoomIn size={13} color="#71717a" />
            <Text className="text-xs text-muted-foreground">
              Belisque pra dar zoom, 2 toques pra resetar
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={!!selecionado}
        transparent
        animationType="fade"
        onRequestClose={() => setSelecionado(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 p-6"
          onPress={() => setSelecionado(null)}
        >
          <View className="w-full max-w-sm overflow-hidden rounded-xl bg-card">
            {selecionado?.fotoUrl && (
              <Image
                source={{ uri: selecionado.fotoUrl }}
                style={{ width: "100%", height: 160, backgroundColor: "#f4f4f5" }}
                contentFit="contain"
              />
            )}
            <View className="gap-2 p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-semibold text-foreground">
                  {selecionado?.cidade ? `${selecionado.cidade}, ` : ""}
                  {selecionado?.nomePais}
                </Text>
                <Pressable onPress={() => setSelecionado(null)}>
                  <X size={18} color="#71717a" />
                </Pressable>
              </View>
              {selecionado?.status !== "desejo" && (
                <Text className="text-sm text-muted-foreground">
                  {selecionado && formatarIntervalo(selecionado.dataInicio, selecionado.dataFim)}
                </Text>
              )}
              {selecionado?.observacoes && (
                <Text className="text-sm text-foreground">{selecionado.observacoes}</Text>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: cor }} />
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
