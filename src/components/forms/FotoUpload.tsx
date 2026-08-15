import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { ImagePlus, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";

const BUCKET_FOTOS = "fotos-viagens";
const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8 MB

export function FotoUpload({
  urlInicial,
  onChange,
}: {
  urlInicial: string | null;
  onChange: (path: string | null) => void;
}) {
  const [previewUri, setPreviewUri] = useState<string | null>(urlInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionarImagem() {
    setErro(null);
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setErro("Permissão de acesso às fotos negada.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
    });
    if (resultado.canceled || !resultado.assets[0]) return;

    const asset = resultado.assets[0];
    if (asset.fileSize && asset.fileSize > TAMANHO_MAXIMO) {
      setErro("A imagem precisa ter até 8 MB.");
      return;
    }

    setEnviando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErro("Sessão expirada. Faça login novamente.");
        return;
      }

      const extensao =
        asset.fileName?.split(".").pop() || asset.mimeType?.split("/").pop() || "jpg";
      const caminho = `${user.id}/${Crypto.randomUUID()}.${extensao}`;

      const resposta = await fetch(asset.uri);
      const arrayBuffer = await resposta.arrayBuffer();

      const { error } = await supabase.storage
        .from(BUCKET_FOTOS)
        .upload(caminho, arrayBuffer, { contentType: asset.mimeType ?? "image/jpeg" });
      if (error) {
        setErro(`Falha ao enviar foto: ${error.message}`);
        return;
      }

      setPreviewUri(asset.uri);
      onChange(caminho);
    } finally {
      setEnviando(false);
    }
  }

  function remover() {
    setPreviewUri(null);
    onChange(null);
  }

  return (
    <View className="gap-2">
      {previewUri ? (
        <View className="relative self-start">
          <Image
            source={{ uri: previewUri }}
            style={{ width: 160, height: 160, borderRadius: 8 }}
            contentFit="cover"
          />
          <Pressable
            onPress={remover}
            className="absolute -right-2 -top-2 size-7 items-center justify-center rounded-full bg-destructive"
          >
            <X size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={selecionarImagem}
          disabled={enviando}
          className="flex-row items-center gap-2 self-start rounded-md border border-border px-3 py-2 disabled:opacity-50"
        >
          <ImagePlus size={16} color="#71717a" />
          <Text className="text-sm text-foreground">
            {enviando ? "Enviando..." : "Adicionar foto"}
          </Text>
        </Pressable>
      )}
      {erro && <Text className="text-xs text-destructive">{erro}</Text>}
    </View>
  );
}
