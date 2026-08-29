import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { TODOS_PAISES, paisPorCca2 } from "@/lib/domain/paises";
import type { PaisRef } from "@/lib/domain/types";
import { normalizarTexto } from "@/lib/utils";

export function BuscaPais({
  value,
  onChange,
}: {
  value: string;
  onChange: (pais: PaisRef) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const atual = paisPorCca2(value);
  const insets = useSafeAreaInsets();

  const filtrados = termo.trim()
    ? TODOS_PAISES.filter((p) => normalizarTexto(p.nomePt).includes(normalizarTexto(termo.trim())))
    : TODOS_PAISES;

  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">País</Text>
      <Pressable
        onPress={() => setAberto(true)}
        className="flex-row items-center justify-between rounded-md border border-border px-3 py-2.5"
      >
        <Text className={`text-sm ${atual ? "text-foreground" : "text-muted-foreground"}`}>
          {atual?.nomePt ?? "Selecione um país"}
        </Text>
        <ChevronDown size={16} color="#71717a" />
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAberto(false)}>
            <Pressable
              className="max-h-[80%] rounded-t-xl bg-card pt-2"
              style={{ paddingBottom: insets.bottom + 24 }}
            >
              <Text className="px-4 pb-2 text-sm font-semibold text-foreground">País</Text>
              <TextInput
                autoFocus
                value={termo}
                onChangeText={setTermo}
                placeholder="Digite para buscar (ex.: Portugal)"
                className="mx-4 mb-2 rounded-md border border-border px-3 py-2 text-sm text-foreground"
              />
              <ScrollView keyboardShouldPersistTaps="handled">
                {filtrados.map((p) => (
                  <Pressable
                    key={p.cca2}
                    onPress={() => {
                      onChange(p);
                      setTermo("");
                      setAberto(false);
                    }}
                    className="px-4 py-3"
                  >
                    <Text className="text-sm text-foreground">{p.nomePt}</Text>
                  </Pressable>
                ))}
                {filtrados.length === 0 && (
                  <Text className="px-4 py-3 text-sm text-muted-foreground">
                    Nenhum país encontrado.
                  </Text>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
