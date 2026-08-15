import { Pressable, Text, View } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { LogOut } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";

export function AppDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props} className="bg-background">
      <View className="px-4 pb-4">
        <Text className="text-sm font-semibold text-foreground">Viajando pelo Mundo</Text>
        <Text className="text-xs text-muted-foreground">Seu diário de viagens</Text>
      </View>

      <DrawerItemList {...props} />

      <View className="mt-4 px-3 pb-2">
        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="flex-row items-center gap-2 rounded-md px-3 py-2"
        >
          <LogOut size={16} color="#71717a" />
          <Text className="text-sm text-muted-foreground">Sair</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}
