import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown } from "lucide-react-native";

export interface FormSelectOption {
  value: string;
  label: string;
}

export function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione",
}: {
  label: string;
  value: string;
  options: FormSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const atual = options.find((o) => o.value === value);
  const insets = useSafeAreaInsets();

  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        className="flex-row items-center justify-between rounded-md border border-border px-3 py-2.5"
      >
        <Text className={`text-sm ${atual ? "text-foreground" : "text-muted-foreground"}`}>
          {atual?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color="#71717a" />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAberto(false)}>
          <View
            className="max-h-[70%] rounded-t-xl bg-card pt-2"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <Text className="px-4 pb-2 text-sm font-semibold text-foreground">{label}</Text>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setAberto(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3"
                >
                  <Text className="text-sm text-foreground">{o.label}</Text>
                  {value === o.value && <Check size={16} color="#71717a" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
