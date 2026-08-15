import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatarData } from "@/lib/format";

function paraIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (novoValor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const dataAtual = value ? new Date(`${value}T00:00:00`) : new Date();

  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        className="rounded-md border border-border px-3 py-2.5"
      >
        <Text className={`text-sm ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value ? formatarData(value) : "Selecionar data"}
        </Text>
      </Pressable>
      {aberto && (
        <DateTimePicker
          value={dataAtual}
          mode="date"
          display="default"
          onChange={(event, selecionada) => {
            setAberto(false);
            if (event.type === "set" && selecionada) onChange(paraIso(selecionada));
          }}
        />
      )}
    </View>
  );
}
