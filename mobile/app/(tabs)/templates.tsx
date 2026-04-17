import { View, Text, StyleSheet } from "react-native";

export default function TemplatesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Treinamentos</Text>
      <Text style={styles.subtitle}>
        Catálogo e gestão de treinamentos (em construção)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});

