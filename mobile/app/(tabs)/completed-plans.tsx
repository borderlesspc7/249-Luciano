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
} from "react-native";
import { useForwardedChecklists } from "../../contexts/ForwardedChecklistsContext";
import { useProject } from "../../contexts/ProjectContext";
import { Feather } from "@expo/vector-icons";
import type { ForwardedChecklistItem } from "../../contexts/ForwardedChecklistsContext";

function formatPriority(priority?: "P1" | "P2" | "P3"): string {
  if (!priority) return "";
  if (priority === "P1") return "(P1) High";
  if (priority === "P2") return "(P2) Medium";
  return "(P3) Improvements";
}

type ResolvedAction = {
  id: string;
  checklistName: string;
  folderName: string;
  checklistRefId?: string;
  projectName?: string;
  routeName?: string;
  questionLabel: string;
  responsible?: string;
  priority?: "P1" | "P2" | "P3";
  deadline?: string;
  completedAt?: string | null;
  forwardedAt: string;
};

export default function CompletedPlansScreen() {
  const { items } = useForwardedChecklists();
  const { currentProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<ForwardedChecklistItem | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"plans" | "actions">("plans");
  const [selectedPlanFolder, setSelectedPlanFolder] = useState<string | null>(null);
  const [selectedActionFolder, setSelectedActionFolder] = useState<string | null>(null);
  const [selectedActionChecklist, setSelectedActionChecklist] = useState<string | null>(null);

  const completedItems = useMemo(
    () =>
      items.filter((item) => {
        if (item.status !== "done") return false;
        if (!currentProject) return true;
        const normalizedCurrentProject = currentProject.trim().toLowerCase();
        const itemProject = item.projectName?.trim().toLowerCase();
        if (!itemProject) return true;
        return itemProject === normalizedCurrentProject;
      }),
    [items, currentProject]
  );

  const completedChecklists = useMemo(
    () =>
      completedItems.filter(
        (item) => item.kind === "checklist" || (!item.kind && !item.equipmentId.startsWith("resolved:"))
      ),
    [completedItems]
  );

  const completedByFolder = useMemo(() => {
    const grouped = new Map<string, ForwardedChecklistItem[]>();
    completedChecklists.forEach((item) => {
      const folder = item.folderName?.trim() || "Sem diretório";
      const current = grouped.get(folder) ?? [];
      current.push(item);
      grouped.set(folder, current);
    });

    return Array.from(grouped.entries())
      .map(([folderName, folderItems]) => ({
        folderName,
        items: folderItems.sort((a, b) =>
          (b.completedAt ?? b.forwardedAt).localeCompare(a.completedAt ?? a.forwardedAt)
        ),
      }))
      .sort((a, b) => a.folderName.localeCompare(b.folderName, "pt-BR"));
  }, [completedChecklists]);

  const resolvedActions = useMemo<ResolvedAction[]>(
    () =>
      completedItems
        .filter(
          (item) => item.kind === "resolved_action" || (!item.kind && item.equipmentId.startsWith("resolved:"))
        )
        .map((item) => ({
          id: item.id,
          checklistName: item.routeName?.trim() || "Checklist sem nome",
          folderName: item.folderName?.trim() || "Sem diretório",
          checklistRefId: item.checklistRefId,
          projectName: item.projectName,
          routeName: item.routeName,
          questionLabel: item.equipmentName,
          responsible: item.responsible,
          priority: item.priority,
          deadline: item.deadline,
          completedAt: item.completedAt,
          forwardedAt: item.forwardedAt,
        })),
    [completedItems]
  );

  const resolvedActionsByChecklist = useMemo(() => {
    const grouped = new Map<string, ResolvedAction[]>();
    resolvedActions.forEach((action) => {
      const key =
        action.checklistRefId && action.checklistRefId.trim()
          ? `ref:${action.checklistRefId}`
          : `${action.folderName}||${action.checklistName}`;
      const current = grouped.get(key) ?? [];
      current.push(action);
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .map((actions) => ({
        checklistRefId: actions[0]?.checklistRefId,
        folderName: actions[0]?.folderName ?? "Sem diretório",
        checklistName: actions[0]?.checklistName ?? "Checklist sem nome",
        actions: actions.sort((a, b) =>
          (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        ),
      }))
      .sort((a, b) => {
        const folderCmp = a.folderName.localeCompare(b.folderName, "pt-BR");
        if (folderCmp !== 0) return folderCmp;
        return a.checklistName.localeCompare(b.checklistName, "pt-BR");
      });
  }, [resolvedActions]);

  const resolvedActionsByFolder = useMemo(() => {
    const grouped = new Map<
      string,
      Array<{ checklistName: string; checklistRefId?: string; actions: ResolvedAction[] }>
    >();

    resolvedActionsByChecklist.forEach((group) => {
      const current = grouped.get(group.folderName) ?? [];
      current.push({
        checklistName: group.checklistName,
        checklistRefId: group.checklistRefId,
        actions: group.actions,
      });
      grouped.set(group.folderName, current);
    });

    return Array.from(grouped.entries())
      .map(([folderName, checklists]) => ({
        folderName,
        checklists: checklists.sort((a, b) =>
          a.checklistName.localeCompare(b.checklistName, "pt-BR")
        ),
      }))
      .sort((a, b) => a.folderName.localeCompare(b.folderName, "pt-BR"));
  }, [resolvedActionsByChecklist]);

  const selectedPlanFolderGroup = useMemo(
    () => completedByFolder.find((group) => group.folderName === selectedPlanFolder),
    [completedByFolder, selectedPlanFolder]
  );

  const selectedActionFolderGroup = useMemo(
    () => resolvedActionsByFolder.find((group) => group.folderName === selectedActionFolder),
    [resolvedActionsByFolder, selectedActionFolder]
  );

  const selectedActionChecklistGroup = useMemo(
    () =>
      selectedActionFolderGroup?.checklists.find(
        (group) => group.checklistName === selectedActionChecklist
      ),
    [selectedActionFolderGroup, selectedActionChecklist]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          {viewMode === "plans" && selectedPlanFolder && (
            <TouchableOpacity
              style={styles.topBackRow}
              onPress={() => setSelectedPlanFolder(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.topBackRowText}>‹ Voltar para diretórios</Text>
            </TouchableOpacity>
          )}
          {viewMode === "actions" && selectedActionFolder && !selectedActionChecklist && (
            <TouchableOpacity
              style={styles.topBackRow}
              onPress={() => setSelectedActionFolder(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.topBackRowText}>‹ Voltar para diretórios</Text>
            </TouchableOpacity>
          )}
          {viewMode === "actions" && selectedActionChecklist && (
            <TouchableOpacity
              style={styles.topBackRow}
              onPress={() => setSelectedActionChecklist(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.topBackRowText}>‹ Voltar para checklists</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Planos concluídos</Text>
          <Text style={styles.subtitle}>
            Histórico de checklists concluídos.
          </Text>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "plans" && styles.tabButtonActive,
              ]}
              onPress={() => {
                setViewMode("plans");
                setSelectedActionFolder(null);
                setSelectedActionChecklist(null);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  viewMode === "plans" && styles.tabButtonTextActive,
                ]}
              >
                Checklists
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                viewMode === "actions" && styles.tabButtonActive,
              ]}
              onPress={() => {
                setViewMode("actions");
                setSelectedPlanFolder(null);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  viewMode === "actions" && styles.tabButtonTextActive,
                ]}
              >
                Ações resolvidas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === "plans" ? (
            completedChecklists.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="check-square" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  Nenhum plano de ação concluído ainda.
                </Text>
                <Text style={styles.emptyHint}>
                  Conclua um checklist na aba "Checklist" para vê-lo aqui.
                </Text>
              </View>
            ) : (
              <>
                {selectedPlanFolder ? (
                  <>
                    <Text style={styles.groupTitle}>
                      Diretório: {selectedPlanFolder}
                    </Text>
                    {(selectedPlanFolderGroup?.items ?? []).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() => setSelectedItem(item)}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{item.equipmentName}</Text>
                          <Text style={styles.cardDate}>
                            {new Date(item.completedAt ?? item.forwardedAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </Text>
                        </View>
                        {(item.projectName || item.routeName) && (
                          <View style={styles.cardContextRow}>
                            {item.projectName && (
                              <Text style={styles.cardMetaText}>
                                Projeto: {item.projectName}
                              </Text>
                            )}
                            {item.routeName && (
                              <Text style={styles.cardMetaText}>
                                Checklist: {item.routeName}
                              </Text>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  completedByFolder.map((group) => (
                    <TouchableOpacity
                      key={group.folderName}
                      style={styles.folderCard}
                      activeOpacity={0.85}
                      onPress={() => setSelectedPlanFolder(group.folderName)}
                    >
                      <View style={styles.folderCardIcon}>
                        <Feather name="folder" size={18} color="#166534" />
                      </View>
                      <View style={styles.folderCardInfo}>
                        <Text style={styles.folderCardTitle}>{group.folderName}</Text>
                        <Text style={styles.folderCardMeta}>
                          {group.items.length} checklist(s) concluído(s)
                        </Text>
                      </View>
                      <Text style={styles.folderCardChevron}>›</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )
          ) : resolvedActionsByFolder.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="check-circle" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Nenhuma ação corretiva resolvida.</Text>
              <Text style={styles.emptyHint}>
                Quando uma ação corretiva for tratada e o checklist for concluído, ela aparecerá aqui.
              </Text>
            </View>
          ) : (
            <>
              {!selectedActionFolder ? (
                resolvedActionsByFolder.map((folderGroup) => (
                  <TouchableOpacity
                    key={folderGroup.folderName}
                    style={styles.folderCard}
                    activeOpacity={0.85}
                    onPress={() => setSelectedActionFolder(folderGroup.folderName)}
                  >
                    <View style={styles.folderCardIcon}>
                      <Feather name="folder" size={18} color="#166534" />
                    </View>
                    <View style={styles.folderCardInfo}>
                      <Text style={styles.folderCardTitle}>{folderGroup.folderName}</Text>
                      <Text style={styles.folderCardMeta}>
                        {folderGroup.checklists.length} checklist(s) com ações resolvidas
                      </Text>
                    </View>
                    <Text style={styles.folderCardChevron}>›</Text>
                  </TouchableOpacity>
                ))
              ) : !selectedActionChecklist ? (
                <>
                  <Text style={styles.groupTitle}>Diretório: {selectedActionFolder}</Text>
                  {(selectedActionFolderGroup?.checklists ?? []).map((checklistGroup) => (
                    <TouchableOpacity
                      key={`${selectedActionFolder}-${checklistGroup.checklistRefId ?? checklistGroup.checklistName}`}
                      style={styles.folderCard}
                      activeOpacity={0.85}
                      onPress={() => setSelectedActionChecklist(checklistGroup.checklistName)}
                    >
                      <View style={styles.folderCardIcon}>
                        <Feather name="folder" size={18} color="#166534" />
                      </View>
                      <View style={styles.folderCardInfo}>
                        <Text style={styles.folderCardTitle}>{checklistGroup.checklistName}</Text>
                        <Text style={styles.folderCardMeta}>
                          {checklistGroup.actions.length} ação(ões) resolvida(s)
                        </Text>
                      </View>
                      <Text style={styles.folderCardChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  <Text style={styles.groupTitle}>
                    {selectedActionFolder} / {selectedActionChecklist}
                  </Text>
                  {(selectedActionChecklistGroup?.actions ?? []).map((action) => (
                    <View key={action.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{action.questionLabel}</Text>
                        <Text style={styles.cardDate}>
                          {new Date(action.completedAt ?? action.forwardedAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </Text>
                      </View>
                      {action.projectName && (
                        <View style={styles.cardContextRow}>
                          <Text style={styles.cardMetaText}>Projeto: {action.projectName}</Text>
                        </View>
                      )}
                      <View style={styles.cardMetaRow}>
                        {action.responsible && (
                          <Text style={styles.cardMetaText}>Resp.: {action.responsible}</Text>
                        )}
                        {action.priority && (
                          <Text style={styles.priorityBadge}>
                            {formatPriority(action.priority)}
                          </Text>
                        )}
                        {action.deadline && (
                          <Text style={styles.cardMetaText}>
                            Prazo:{" "}
                            {new Date(action.deadline).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
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
              <>
                <Text style={styles.detailTitle}>Plano concluído</Text>
                {(selectedItem.projectName || selectedItem.routeName || selectedItem.folderName) && (
                  <View style={styles.detailContextRow}>
                    {selectedItem.folderName && (
                      <Text style={styles.detailContextText}>
                        Diretório: {selectedItem.folderName}
                      </Text>
                    )}
                    {selectedItem.projectName && (
                      <Text style={styles.detailContextText}>
                        Projeto: {selectedItem.projectName}
                      </Text>
                    )}
                    {selectedItem.routeName && (
                      <Text style={styles.detailContextText}>
                        Checklist: {selectedItem.routeName}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaText}>
                    Concluído em:{" "}
                    {new Date(
                      selectedItem.completedAt ?? selectedItem.forwardedAt
                    ).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                  {selectedItem.responsible && (
                    <Text style={styles.detailMetaText}>
                      Responsável: {selectedItem.responsible}
                    </Text>
                  )}
                  {selectedItem.priority && (
                  <Text style={styles.detailMetaText}>
                      Prioridade: {formatPriority(selectedItem.priority)}
                    </Text>
                  )}
                </View>

                <Text style={styles.detailSectionTitle}>
                  Comentários do checklist
                </Text>
                {Object.entries(selectedItem.comments)
                  .filter(([, text]) => text?.trim())
                  .map(([questionId, text]) => (
                    <View key={questionId} style={styles.detailCommentBlock}>
                      <Text style={styles.detailQuestion}>
                        {selectedItem.questionLabels?.[questionId] ?? questionId}
                      </Text>
                      {selectedItem.questionResponsibles?.[questionId]?.trim() ? (
                        <Text style={styles.detailMetaText}>
                          Responsável: {selectedItem.questionResponsibles[questionId]}
                        </Text>
                      ) : null}
                      {selectedItem.questionPriorities?.[questionId] ? (
                        <Text style={styles.detailMetaText}>
                          Prioridade: {formatPriority(selectedItem.questionPriorities[questionId])}
                        </Text>
                      ) : null}
                      {selectedItem.questionDeadlines?.[questionId] ? (
                        <Text style={styles.detailMetaText}>
                          Data limite:{" "}
                          {new Date(selectedItem.questionDeadlines[questionId]).toLocaleDateString(
                            "pt-BR",
                            { day: "2-digit", month: "2-digit", year: "numeric" }
                          )}
                        </Text>
                      ) : null}
                      <Text style={styles.detailCommentLabel}>Comentário:</Text>
                      <Text style={styles.detailCommentText}>{text}</Text>
                    </View>
                  ))}

                <TouchableOpacity
                  style={styles.detailCloseButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.detailCloseButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
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
  tabRow: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: "#d1fae5",
    borderRadius: 999,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: "#14532d",
  },
  tabButtonText: {
    fontSize: 13,
    color: "#14532d",
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  topBackRow: {
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  topBackRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 8,
  },
  folderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  folderCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ecfdf3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  folderCardInfo: {
    flex: 1,
  },
  folderCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#14532d",
  },
  folderCardMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  folderCardChevron: {
    fontSize: 18,
    color: "#6b7280",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14532d",
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  cardContextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  cardMetaText: {
    fontSize: 13,
    color: "#6b7280",
  },
  priorityBadge: {
    fontSize: 12,
    color: "#ffffff",
    backgroundColor: "#1a472a",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 8,
  },
  detailContextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  detailContextText: {
    fontSize: 13,
    color: "#4b5563",
  },
  detailMetaRow: {
    marginBottom: 12,
    gap: 4,
  },
  detailMetaText: {
    fontSize: 13,
    color: "#4b5563",
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 8,
  },
  detailCommentBlock: {
    marginBottom: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  detailQuestion: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  detailCommentLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  detailCommentText: {
    fontSize: 13,
    color: "#111827",
  },
  detailCloseButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#1a472a",
  },
  detailCloseButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});

