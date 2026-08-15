import { Text, View } from "react-native";
import type { StatusViagem } from "@/lib/domain/types";
import { LABEL_STATUS } from "@/lib/domain/enums";

export function StatusBadge({ status }: { status: StatusViagem }) {
  const cor =
    status === "realizada"
      ? "bg-primary"
      : status === "planejada"
        ? "bg-violet"
        : "bg-muted";
  const corTexto = status === "desejo" ? "text-muted-foreground" : "text-primary-foreground";

  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${cor}`}>
      <Text className={`text-xs font-medium ${corTexto}`}>{LABEL_STATUS[status]}</Text>
    </View>
  );
}
