import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import syngentaLogo from "../../assets/images/syngenta-logo.png";
import fieldImage from "../../assets/images/campo-login.jpg";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe seu e-mail.");
      return;
    }
    clearError?.();
    setSent(false);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch {
      // erro já exibido pelo contexto
    }
  };

  if (sent) {
    return (
      <ImageBackground
        source={fieldImage}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            <View style={styles.logoContainer}>
              <Image source={syngentaLogo} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>E-mail enviado</Text>
              <Text style={styles.successText}>
                Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e o spam.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.buttonText}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={fieldImage}
      resizeMode="cover"
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.logoContainer}>
            <Image source={syngentaLogo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar link de recuperação</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => {
                clearError?.();
                router.replace("/(auth)/login");
              }}
            >
              <Text style={styles.linkText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  logo: {
    width: 500,
    height: 300,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1a472a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  successText: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
  },
  error: {
    color: "#c00",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1a472a",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#1a472a",
    fontSize: 14,
  },
});
