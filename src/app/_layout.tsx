import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/global.css";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null;
  if (!session && pathname !== "/login") return <Redirect href="/login" />;
  if (session && pathname === "/login") return <Redirect href="/" />;

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="(drawer)" />
                <Stack.Screen
                  name="viagem/nova"
                  options={{ headerShown: true, title: "Nova viagem" }}
                />
                <Stack.Screen
                  name="viagem/[id]"
                  options={{ headerShown: true, title: "Editar viagem" }}
                />
              </Stack>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
