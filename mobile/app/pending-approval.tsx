import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Feather name="clock" size={56} color="#1a472a" />
      </View>

      <Text style={styles.title}>Cadastro em análise</Text>
      <Text style={styles.message}>
        Seu cadastro foi recebido com sucesso e está aguardando a aprovação do
        administrador.{"\n\n"}
        Assim que for aprovado, você receberá acesso ao sistema.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="log-out" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Sair</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ecfdf3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a472a",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a472a",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
