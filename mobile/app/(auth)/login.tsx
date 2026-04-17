import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import syngentaLogo from "../../assets/images/syngenta-logo.png";
import fieldImage from "../../assets/images/campo-login.jpg";

const OVERLAY_COLOR = "rgba(0, 0, 0, 0.25)";

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const animateLayout = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      animateLayout();
      setIsKeyboardOpen(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      animateLayout();
      setIsKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha.");
      return;
    }
    clearError?.();
    try {
      await login({ email: email.trim(), password });
      router.replace("/(tabs)/menu");
    } catch (e) {
      // erro já tratado no contexto
    }
  };

  return (
    <ImageBackground
      source={fieldImage}
      resizeMode="cover"
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.backdropOverlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardOpen && styles.scrollContentKeyboardOpen,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.overlay, isKeyboardOpen && styles.overlayKeyboardOpen]}>
            <View style={styles.logoContainer}>
              <Image
                source={syngentaLogo}
                style={[styles.logo, isKeyboardOpen && styles.logoKeyboardOpen]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Login</Text>

              <TextInput
                style={styles.input}
                placeholder="Login"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
                  <Text style={styles.buttonText}>Acessar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={() => router.push("/forgot-password")}
              >
                <Text style={styles.linkText}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_COLOR,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  scrollContentKeyboardOpen: {
    paddingBottom: 120,
  },
  overlay: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  overlayKeyboardOpen: {
    paddingTop: 36,
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
  logoKeyboardOpen: {
    height: 170,
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
    marginBottom: 24,
    color: "#1a472a",
    textAlign: "center",
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
