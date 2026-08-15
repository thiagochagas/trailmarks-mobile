import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// O Expo Router renderiza a versão web no servidor (Node.js) — nesse
// ambiente não existe `window`/AsyncStorage de verdade, então evitamos
// persistir/recuperar sessão ali (o app real, nativo ou no navegador do
// usuário, sempre roda fora do Node e funciona normalmente).
const rodandoNoNode = typeof process !== "undefined" && !!process.versions?.node;

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: rodandoNoNode ? undefined : AsyncStorage,
      autoRefreshToken: !rodandoNoNode,
      persistSession: !rodandoNoNode,
      detectSessionInUrl: false,
    },
  }
);
