import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useForwardedChecklists } from "../contexts/ForwardedChecklistsContext";
import { useChecklistDrafts } from "../contexts/ChecklistDraftsContext";
import { sharedProjectService } from "../services/sharedProjectService";
import type { SharedProject } from "../services/sharedProjectService";
import syngentaLogo from "../assets/images/syngenta-logo.png";
import fieldImage from "../assets/images/campo-login.jpg";
import { useAuth } from "../hooks/useAuth";
import { useProject } from "../contexts/ProjectContext";

export default function ProjectHomeScreen() {
  const router = useRouter();
  const { items: forwardedItems } = useForwardedChecklists();
  const { items: draftItems } = useChecklistDrafts();
  const { user } = useAuth();
  const { setCurrentProject } = useProject();
  const isReader = user?.role === "reader";
  const [newProjectName, setNewProjectName] = useState("");
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingProjects(true);
        const data = await sharedProjectService.listAll();
        if (!cancelled) setSharedProjects(data);
      } catch {
        if (!cancelled) setSharedProjects([]);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const projects = useMemo(() => {
    const set = new Set<string>();

    // Projetos salvos no Firestore (compartilhados entre todos)
    sharedProjects.forEach(({ name }) => {
      if (name && name.trim()) set.add(name.trim());
    });

    // Projetos inferidos dos checklists concluídos
    forwardedItems.forEach((item) => {
      const name = item.projectName && item.projectName.trim() ? item.projectName.trim() : "FW+";
      set.add(name);
    });

    // Projetos inferidos dos rascunhos de checklists
    draftItems.forEach((item) => {
      const name = item.projectName && item.projectName.trim() ? item.projectName.trim() : "FW+";
      set.add(name);
    });

    if (set.size === 0) set.add("FW+");
    if (!Array.from(set).some((name) => name === "FW+")) set.add("FW+");

    const list = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((name) => name.toLowerCase().includes(term));
  }, [sharedProjects, forwardedItems, draftItems, search]);

  const handleSelectProject = (name: string) => {
    setCurrentProject(name);
    router.replace({ pathname: "/(tabs)/menu" });
  };

  const handleCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed || !user) return;

    const alreadyExists = sharedProjects.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setCurrentProject(trimmed);
      setNewProjectName("");
      setModalVisible(false);
      router.replace({ pathname: "/(tabs)/menu" });
      return;
    }

    try {
      const created = await sharedProjectService.create(trimmed, user.uid);
      setSharedProjects((prev) => [...prev, created]);
    } catch {
      // mesmo se falhar no Firestore, deixa selecionar localmente
    }

    setCurrentProject(trimmed);
    setNewProjectName("");
    setModalVisible(false);
    router.replace({ pathname: "/(tabs)/menu" });
  };

  const canGoBack = router.canGoBack();

  return (
    <ImageBackground source={fieldImage} resizeMode="cover" style={styles.background}>
      {canGoBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.logoContainer}>
            <Image source={syngentaLogo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Selecione um projeto</Text>
              {!isReader && (
                <TouchableOpacity
                  style={styles.addProjectButton}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addProjectIcon}>＋</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar projeto pelo nome"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView
              style={styles.projectsScroll}
              contentContainerStyle={styles.projectsList}
              showsVerticalScrollIndicator={false}
            >
              {projects.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.projectButton}
                  activeOpacity={0.9}
                  onPress={() => handleSelectProject(name)}
                >
                  <Text style={styles.projectButtonText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Novo projeto</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do novo projeto"
              placeholderTextColor="#9CA3AF"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setModalVisible(false);
                  setNewProjectName("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  !newProjectName.trim() && styles.createButtonDisabled,
                ]}
                activeOpacity={0.9}
                disabled={!newProjectName.trim()}
                onPress={handleCreateProject}
              >
                <Text style={styles.createButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 52,
    left: 16,
    zIndex: 10,
    padding: 8,
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
  },
  logo: {
    width: 500,
    height: 300,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532d",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 10,
  },
  projectsScroll: {
    maxHeight: 220,
  },
  projectsList: {
    gap: 10,
  },
  projectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  projectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#166534",
  },
  addProjectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  addProjectIcon: {
    fontSize: 18,
    color: "#14532d",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 10,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#1a472a",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
});

