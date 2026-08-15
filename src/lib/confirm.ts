import { Alert, Platform } from "react-native";

export function confirmar(titulo: string, mensagem: string, onConfirmar: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${titulo}\n${mensagem}`)) onConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    { text: "Confirmar", style: "destructive", onPress: onConfirmar },
  ]);
}
