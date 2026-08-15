import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    setEntrando(true);
    setErro(null);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo esgotado ao conectar no Supabase.")), 15000)
      );
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email: email.trim(), password: senha }),
        timeout,
      ]);
      if (error) setErro(error.message);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao conectar.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">Viajando pelo Mundo</Text>

      <View className="w-full max-w-sm gap-3">
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground">E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            className="rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
          />
        </View>
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground">Senha</Text>
          <View className="flex-row items-center rounded-md border border-border">
            <TextInput
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!senhaVisivel}
              autoComplete="password"
              textContentType="password"
              className="flex-1 px-3 py-2.5 text-sm text-foreground"
            />
            <Pressable onPress={() => setSenhaVisivel((v) => !v)} className="px-3 py-2.5">
              {senhaVisivel ? (
                <EyeOff size={18} color="#71717a" />
              ) : (
                <Eye size={18} color="#71717a" />
              )}
            </Pressable>
          </View>
        </View>

        {erro && <Text className="text-sm text-destructive">{erro}</Text>}

        <Pressable
          onPress={entrar}
          disabled={entrando}
          className="items-center rounded-md bg-primary py-3 disabled:opacity-50"
        >
          <Text className="font-medium text-primary-foreground">
            {entrando ? "Entrando..." : "Entrar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
