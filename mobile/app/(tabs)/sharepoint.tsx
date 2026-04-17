import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useChecklistDrafts } from "../../contexts/ChecklistDraftsContext";
import { useProject } from "../../contexts/ProjectContext";
import {
  findQuestionLabelFromKey,
  buildQuestionsForEquipment,
} from "../commissioning-checklist";

type CorrectiveActionItem = {
  draftId: string;
  questionKey: string;
  questionLabel: string;
  routeName?: string;
  projectName?: string;
  responsible?: string;
  deadline?: string;
  priority?: "P1" | "P2" | "P3";
  comment?: string;
};

function formatPriority(priority?: "P1" | "P2" | "P3"): string {
  if (!priority) return "";
  if (priority === "P1") return "(P1) High";
  if (priority === "P2") return "(P2) Medium";
  return "(P3) Improvements";
}

function priorityColor(priority?: "P1" | "P2" | "P3"): string {
  if (priority === "P1") return "#dc2626";
  if (priority === "P2") return "#f59e0b";
  return "#16a34a";
}

function formatQuestionKey(key: string): string {
  const parts = key.split(":");
  const baseId = parts[parts.length - 1] ?? key;
  const cleaned = baseId.replace(/_/g, " ").trim();
  if (!cleaned) return key;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function SharePointScreen() {
  const router = useRouter();
  const { items: drafts } = useChecklistDrafts();
  const { currentProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<CorrectiveActionItem | null>(null);
  const [search, setSearch] = useState("");

  const actionItems = useMemo(() => {
    const result: CorrectiveActionItem[] = [];
    const normalizedCurrentProject = currentProject?.trim().toLowerCase();

    for (const draft of drafts) {
      if (normalizedCurrentProject) {
        const draftProject =
          draft.projectName && draft.projectName.trim()
            ? draft.projectName.trim().toLowerCase()
            : "";
        if (draftProject && draftProject !== normalizedCurrentProject) continue;
      }

      const answers = draft.answers ?? {};
      const comments = draft.comments ?? {};
      const responsibles = draft.questionResponsibles ?? {};
      const priorities = draft.questionPriorities ?? {};
      const deadlines = draft.questionDeadlines ?? {};
      const labels = draft.questionLabels ?? {};

      const equipmentIds = draft.equipmentIds ?? [];

      for (const [key, value] of Object.entries(answers)) {
        if (value !== "no") continue;

        const savedLabel = labels[key];
        const dynamicLabel = savedLabel || findQuestionLabelFromKey(key, equipmentIds);
        const displayLabel = dynamicLabel || formatQuestionKey(key);

        result.push({
          draftId: draft.id,
          questionKey: key,
          questionLabel: displayLabel,
          routeName: draft.routeName,
          projectName: draft.projectName,
          responsible: responsibles[key] || undefined,
          deadline: deadlines[key] || undefined,
          priority: priorities[key] || undefined,
          comment: comments[key] || undefined,
        });
      }
    }

    result.sort((a, b) => {
      const pOrder = { P1: 0, P2: 1, P3: 2 };
      const pa = a.priority ? pOrder[a.priority] : 3;
      const pb = b.priority ? pOrder[b.priority] : 3;
      if (pa !== pb) return pa - pb;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

    return result;
  }, [drafts, currentProject]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return actionItems;
    return actionItems.filter((item) => {
      const label = item.questionLabel.toLowerCase();
      const route = (item.routeName ?? "").toLowerCase();
      const responsible = (item.responsible ?? "").toLowerCase();
      const project = (item.projectName ?? "").toLowerCase();
      return (
        label.includes(term) ||
        route.includes(term) ||
        responsible.includes(term) ||
        project.includes(term)
      );
    });
  }, [actionItems, search]);

  const handleGoToChecklist = (item: CorrectiveActionItem) => {
    setSelectedItem(null);
    const draft = drafts.find((d) => d.id === item.draftId);
    if (!draft) return;
    router.push({
      pathname: "/commissioning-checklist",
      params: {
        draftId: item.draftId,
        projectName: draft.projectName ?? "",
        routeName: draft.routeName ?? "",
        folderName: draft.folderName ?? "",
        focusQuestionKey: item.questionKey,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ações corretivas</Text>
          <Text style={styles.subtitle}>
            Tópicos com "Não" dos seus checklists em andamento.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por tópico, rota ou responsável"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="check-circle" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Nenhuma ação corretiva pendente.</Text>
              <Text style={styles.emptyHint}>
                Quando um tópico receber "Não" em um checklist salvo, ele aparecerá aqui.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {filteredItems.length} item(ns) pendente(s)
                </Text>
              </View>
              {filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.draftId}-${item.questionKey}-${idx}`}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => setSelectedItem(item)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLabelCol}>
                      <Text style={styles.cardQuestion} numberOfLines={2}>
                        {item.questionLabel}
                      </Text>
                      {item.routeName && (
                        <Text style={styles.cardRoute}>Rota: {item.routeName}</Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: item.priority
                            ? priorityColor(item.priority)
                            : "#9ca3af",
                        },
                      ]}
                    >
                      <Text style={styles.priorityBadgeText}>
                        {item.priority ?? "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaChip}>
                      <Feather name="user" size={12} color="#4b5563" />
                      <Text style={styles.metaChipText}>
                        {item.responsible || "Não informado"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Feather name="calendar" size={12} color="#4b5563" />
                      <Text style={styles.metaChipText}>
                        {item.deadline
                          ? new Date(item.deadline).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "Sem prazo"}
                      </Text>
                    </View>
                    {item.comment?.trim() && (
                      <View style={styles.metaChip}>
                        <Feather name="message-circle" size={12} color="#4b5563" />
                        <Text style={styles.metaChipText}>Com comentário</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={styles.detailOverlay}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={styles.detailContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>Ação corretiva</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Tópico</Text>
                  <Text style={styles.detailQuestionText}>
                    {selectedItem.questionLabel}
                  </Text>
                </View>

                {(selectedItem.routeName || selectedItem.projectName) && (
                  <View style={styles.detailSection}>
                    {selectedItem.projectName && (
                      <Text style={styles.detailMeta}>
                        Projeto: {selectedItem.projectName}
                      </Text>
                    )}
                    {selectedItem.routeName && (
                      <Text style={styles.detailMeta}>
                        Rota: {selectedItem.routeName}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>Responsável</Text>
                    <Text
                      style={[
                        styles.detailInfoValue,
                        !selectedItem.responsible && styles.detailInfoEmpty,
                      ]}
                    >
                      {selectedItem.responsible || "Não informado"}
                    </Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>Prioridade</Text>
                    {selectedItem.priority ? (
                      <View style={styles.detailPriorityRow}>
                        <View
                          style={[
                            styles.detailPriorityDot,
                            { backgroundColor: priorityColor(selectedItem.priority) },
                          ]}
                        />
                        <Text style={styles.detailInfoValue}>
                          {formatPriority(selectedItem.priority)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.detailInfoValue, styles.detailInfoEmpty]}>
                        Não informado
                      </Text>
                    )}
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>Data limite</Text>
                    <Text
                      style={[
                        styles.detailInfoValue,
                        !selectedItem.deadline && styles.detailInfoEmpty,
                      ]}
                    >
                      {selectedItem.deadline
                        ? new Date(selectedItem.deadline).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "Não informado"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Comentário</Text>
                  <View style={styles.commentBox}>
                    <Text
                      style={[
                        styles.commentText,
                        !selectedItem.comment?.trim() && styles.detailInfoEmpty,
                      ]}
                    >
                      {selectedItem.comment?.trim() || "Sem comentário"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.goToChecklistButton}
                  activeOpacity={0.9}
                  onPress={() => handleGoToChecklist(selectedItem)}
                >
                  <Ionicons name="open-outline" size={18} color="#fff" />
                  <Text style={styles.goToChecklistText}>Ir para o checklist</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e5f0e9",
  },
  container: {
    flex: 1,
    backgroundColor: "#e5f0e9",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 12,
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
  },
  countRow: {
    marginBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardLabelCol: {
    flex: 1,
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  cardRoute: {
    fontSize: 12,
    color: "#6b7280",
  },
  priorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {
    fontSize: 12,
    color: "#4b5563",
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  detailContent: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailQuestionText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 22,
  },
  detailMeta: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 2,
  },
  detailInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  detailInfoItem: {
    minWidth: "45%",
  },
  detailInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailInfoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  detailInfoEmpty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  detailPriorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  commentBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  commentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  goToChecklistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  goToChecklistText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#1a472a",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
