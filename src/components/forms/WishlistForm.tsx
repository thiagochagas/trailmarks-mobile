import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { Viagem } from "@/lib/domain/types";
import { BuscaPais } from "@/components/forms/BuscaPais";
import { criarViagem, atualizarViagem } from "@/lib/actions/viagens";
import { paisPorCca2 } from "@/lib/domain/paises";

export function WishlistForm({
  visivel,
  item,
  onFechar,
  onSalvo,
}: {
  visivel: boolean;
  item?: Viagem;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [codigoPais, setCodigoPais] = useState(item?.codigoPais ?? "");
  const [cidade, setCidade] = useState(item?.cidade ?? "");
  const [observacoes, setObservacoes] = useState(item?.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const pais = paisPorCca2(codigoPais);
    if (!pais) return;
    setSalvando(true);
    setErro(null);
    const payload = {
      status: "desejo" as const,
      codigoPais,
      nomePais: pais.nomePt,
      cidade: cidade || undefined,
      observacoes: observacoes || undefined,
    };
    const resultado = item ? await atualizarViagem(item.id, payload) : await criarViagem(payload);
    if (!resultado.ok) {
      setErro(resultado.error ?? "Falha ao salvar.");
      setSalvando(false);
      return;
    }
    setSalvando(false);
    onSalvo();
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={onFechar}>
        <View className="w-full max-w-sm gap-3 rounded-xl bg-card p-4">
          <Text className="text-base font-semibold text-foreground">
            {item ? "Editar item da wishlist" : "Adicionar à wishlist"}
          </Text>
          <BuscaPais value={codigoPais} onChange={(p) => setCodigoPais(p.cca2)} />
          <View className="gap-1">
            <Text className="text-xs text-muted-foreground">Cidade (opcional)</Text>
            <TextInput
              value={cidade}
              onChangeText={setCidade}
              className="rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
            />
          </View>
          <View className="gap-1">
            <Text className="text-xs text-muted-foreground">Observações (opcional)</Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
            />
          </View>
          {erro && <Text className="text-sm text-destructive">{erro}</Text>}
          <Pressable
            onPress={salvar}
            disabled={salvando || !codigoPais}
            className="items-center rounded-md bg-primary py-3 disabled:opacity-50"
          >
            <Text className="font-medium text-primary-foreground">
              {salvando ? "Salvando..." : "Salvar"}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
