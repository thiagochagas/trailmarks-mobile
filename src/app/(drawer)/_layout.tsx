import { Drawer } from "expo-router/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { AppDrawerContent } from "@/components/AppDrawerContent";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props: DrawerContentComponentProps) => <AppDrawerContent {...props} />}
      screenOptions={{ headerTitleStyle: { fontSize: 16 } }}
    >
      <Drawer.Screen name="index" options={{ title: "Minhas Viagens" }} />
      <Drawer.Screen name="pessoas" options={{ title: "Pessoas" }} />
      <Drawer.Screen name="mapa" options={{ title: "Mapa" }} />
      <Drawer.Screen name="sugestoes" options={{ title: "Sugestões" }} />
    </Drawer>
  );
}
