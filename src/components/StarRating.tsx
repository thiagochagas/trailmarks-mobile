import { Pressable, Text, View } from "react-native";
import { Star } from "lucide-react-native";

export function StarRating({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (novoValor: number) => void;
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">Avaliação</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => onChange(n === valor ? 0 : n)} className="p-0.5">
            <Star size={22} color="#f97316" fill={n <= valor ? "#f97316" : "transparent"} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
