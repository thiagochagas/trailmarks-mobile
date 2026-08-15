import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export interface SugestaoGeocode {
  label: string;
  cidade: string;
  pais: string;
  lat: number;
  lon: number;
}

interface ResultadoNominatim {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

// Chamado direto do app (sem rota de servidor, ao contrário da web) porque
// apps nativos não sofrem a restrição de CORS que exigiu um proxy na web.
async function buscarSugestoes(q: string): Promise<SugestaoGeocode[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "viajando-pelo-mundo-mobile (personal app)" },
  });
  if (!res.ok) return [];

  const dados = (await res.json()) as ResultadoNominatim[];
  return dados.map((d) => ({
    label: d.display_name,
    cidade: d.address?.city ?? d.address?.town ?? d.address?.village ?? d.display_name.split(",")[0],
    pais: d.address?.country ?? "",
    lat: Number(d.lat),
    lon: Number(d.lon),
  }));
}

export function BuscaCidade({
  value,
  onChange,
  onSelecionar,
}: {
  value: string;
  onChange: (cidade: string) => void;
  onSelecionar: (resultado: SugestaoGeocode) => void;
}) {
  const [sugestoes, setSugestoes] = useState<SugestaoGeocode[]>([]);
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSugestoes([]);
      setAberto(false);
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const dados = await buscarSugestoes(value.trim());
        setSugestoes(dados);
        setAberto(dados.length > 0);
      } catch {
        setSugestoes([]);
      } finally {
        setBuscando(false);
      }
    }, 450);
    return () => clearTimeout(timeoutRef.current);
  }, [value]);

  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">Cidade</Text>
      <View style={{ position: "relative", zIndex: 20 }}>
        <TextInput
          value={value}
          onChangeText={(v) => {
            onChange(v);
            if (v.trim().length < 2) setAberto(false);
          }}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Digite para buscar (ex.: Lisboa)"
          className="rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
        />
        {buscando && (
          <ActivityIndicator
            size="small"
            color="#71717a"
            style={{ position: "absolute", right: 10, top: 12 }}
          />
        )}
        {aberto && sugestoes.length > 0 && (
          <View
            className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-md border border-border bg-card"
            style={{ elevation: 4, zIndex: 30 }}
          >
            {sugestoes.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  onSelecionar(s);
                  onChange(s.cidade);
                  setAberto(false);
                }}
                className="px-3 py-2.5"
              >
                <Text className="text-sm text-foreground" numberOfLines={1}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
