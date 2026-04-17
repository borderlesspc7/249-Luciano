import { useEffect, useRef } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";

export default function SairScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const isFocused = useIsFocused();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isFocused) {
      shownRef.current = false;
      return;
    }
    if (shownRef.current) return;
    shownRef.current = true;

    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => router.replace("/(tabs)/menu"),
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout?.();
            router.replace("/");
          },
        },
      ],
      { cancelable: true },
    );
  }, [isFocused, logout, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a472a" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
});
