import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Você está offline. Alguns dados podem não estar atualizados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
});
