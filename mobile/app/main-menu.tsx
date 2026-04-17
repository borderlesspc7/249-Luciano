import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useProject } from "../contexts/ProjectContext";
import { useChecklistDrafts, type ChecklistDraft } from "../contexts/ChecklistDraftsContext";
import { useChecklistFolders } from "../contexts/ChecklistFoldersContext";
import { useChecklistAreas } from "../contexts/ChecklistAreasContext";
import { useForwardedChecklists } from "../contexts/ForwardedChecklistsContext";
import { SECTIONS, buildQuestionsForEquipment } from "./commissioning-checklist";
import { useAuth } from "../hooks/useAuth";

type DraftChecklistStatus = "not_started" | "warning" | "ok";

const DRAFT_STATUS_META: Record<
  DraftChecklistStatus,
  { label: string; dotColor: string; backgroundColor: string; textColor: string }
> = {
  not_started: {
    label: "Nao iniciado",
    dotColor: "#9ca3af",
    backgroundColor: "#e5e7eb",
    textColor: "#4b5563",
  },
  warning: {
    label: "Atrasado",
    dotColor: "#f59e0b",
    backgroundColor: "#fef3c7",
    textColor: "#92400e",
  },
  ok: {
    label: "OK",
    dotColor: "#16a34a",
    backgroundColor: "#dcfce7",
    textColor: "#166534",
  },
};

export default function MainMenuScreen() {
  const router = useRouter();
  const { folderName, areaName } = useLocalSearchParams<{ folderName?: string; areaName?: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  // null = form, "start" | "end" = calendário inline
  const [calendarShowing, setCalendarShowing] = useState<null | "start" | "end">(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const { currentProject } = useProject();
  const { user } = useAuth();
  const isReader = user?.role === "reader";
  const { items: checklistDrafts, deleteDraft, deleteDraftsByFolder } = useChecklistDrafts();
  const { items: forwardedItems, deleteByFolder: deleteForwardedByFolder } = useForwardedChecklists();
  const { items: areasItems, createArea, deleteArea } = useChecklistAreas();
  const { items: foldersItems, createFolder, deleteFolder } = useChecklistFolders();
  const navigation = useNavigation();
  const delayedPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(delayedPulseAnim, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(delayedPulseAnim, {
          toValue: 0.95,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(delayedPulseAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [delayedPulseAnim]);

  useLayoutEffect(() => {
    if (selectedFolder) {
      navigation.setOptions({
        title: `Checklists de ${selectedFolder}`,
      });
    } else if (selectedArea) {
      navigation.setOptions({
        title: `Diretórios de ${selectedArea}`,
      });
    } else {
      navigation.setOptions({
        title: "Áreas",
      });
    }
  }, [navigation, selectedFolder, selectedArea]);

  useEffect(() => {
    if (typeof areaName === "string" && areaName.trim()) {
      setSelectedArea(areaName);
    }
    if (typeof folderName === "string" && folderName.trim()) {
      setSelectedFolder(folderName);
    }
  }, [areaName, folderName]);

  useEffect(() => {
    if (!selectedArea) {
      setSelectedFolder(null);
    }
  }, [selectedArea]);

  const projectDrafts = useMemo(
    () =>
      checklistDrafts.filter((draft) => {
        if (!currentProject) return true;
        const project =
          draft.projectName && draft.projectName.trim()
            ? draft.projectName.trim()
            : "FW+";
        return project === currentProject;
      }),
    [checklistDrafts, currentProject]
  );

  const projectFolders = useMemo(
    () =>
      foldersItems.filter((folder) => {
        if (!currentProject) return true;
        const project =
          folder.projectName && folder.projectName.trim()
            ? folder.projectName.trim()
            : "FW+";
        return project === currentProject;
      }),
    [foldersItems, currentProject]
  );

  const projectAreas = useMemo(
    () =>
      areasItems.filter((area) => {
        if (!currentProject) return true;
        const project =
          area.projectName && area.projectName.trim()
            ? area.projectName.trim()
            : "FW+";
        return project === currentProject;
      }),
    [areasItems, currentProject]
  );

  const projectCompletedChecklists = useMemo(
    () =>
      forwardedItems.filter((item) => {
        if (item.status !== "done") return false;
        if (item.kind === "resolved_action") return false;
        if (!item.kind && item.equipmentId.startsWith("resolved:")) return false;
        if (!currentProject) return true;
        const normalizedCurrentProject = currentProject.trim().toLowerCase();
        const project = item.projectName?.trim().toLowerCase();
        if (!project) return true;
        return project === normalizedCurrentProject;
      }),
    [forwardedItems, currentProject]
  );

  const isPastDate = (rawDate?: string) => {
    if (!rawDate) return false;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDraftActiveQuestionKeys = (draft: ChecklistDraft) => {
    const OPTIONAL_SECTIONS = SECTIONS.filter((section) => section.id !== "finalChecks");
    const FINAL_SECTION = SECTIONS.find((section) => section.id === "finalChecks") ?? null;

    const activeQuestionKeys: string[] = [];

    draft.equipmentIds.forEach((eq, index) => {
      const sectionId = `equipment:${eq}:${index}`;
      const questions = buildQuestionsForEquipment(eq);
      questions.forEach((q) => {
        activeQuestionKeys.push(`${sectionId}:${q.id}`);
      });
    });

    (draft.instrumentInstances ?? []).forEach(({ instanceId, sectionId, itemId }) => {
      const section = OPTIONAL_SECTIONS.find((s) => s.id === sectionId);
      const item = section?.items.find((i) => i.id === itemId);
      if (item) {
        item.questions.forEach((q) => {
          activeQuestionKeys.push(`${instanceId}:${q.id}`);
        });
      }
    });

    const hasInstruments = (draft.instrumentInstances ?? []).length > 0;
    if (FINAL_SECTION && (draft.equipmentIds.length > 0 || hasInstruments)) {
      FINAL_SECTION.items[0].questions.forEach((q) => {
        activeQuestionKeys.push(`finalChecks:${q.id}`);
      });
    }

    return activeQuestionKeys;
  };

  const getDraftChecklistStatus = (draft: ChecklistDraft): DraftChecklistStatus => {
    const activeQuestionKeys = getDraftActiveQuestionKeys(draft);
    if (activeQuestionKeys.length === 0) return "not_started";

    const answeredCount = activeQuestionKeys.filter((key) => {
      const value = draft.answers[key];
      return value === "yes" || value === "no";
    }).length;

    if (answeredCount === 0) return "not_started";

    const hasRouteDelay = isPastDate(draft.endDate);
    const hasTopicDelay = Object.entries(draft.questionDeadlines ?? {}).some(([questionKey, deadline]) => {
      if (!isPastDate(deadline)) return false;
      return draft.answers[questionKey] !== "yes";
    });

    if (hasRouteDelay || hasTopicDelay) return "warning";
    return "ok";
  };

  const isDraftDelayed = (draft: ChecklistDraft) => getDraftChecklistStatus(draft) === "warning";

  const filteredDrafts = useMemo(
    () => {
      if (!selectedFolder) return [];

      const term = search.trim().toLowerCase();
      const folderDrafts = projectDrafts.filter((draft) => {
        const draftFolder = draft.folderName ?? "Sem pasta";
        return draftFolder === selectedFolder;
      });

      const searchedDrafts = !term
        ? folderDrafts
        : folderDrafts.filter((draft) => {
            const project = (draft.projectName ?? "").toLowerCase();
            const route = (draft.routeName ?? "").toLowerCase();
            return project.includes(term) || route.includes(term);
          });

      return [...searchedDrafts].sort((a, b) => {
        const aDelayed = isDraftDelayed(a);
        const bDelayed = isDraftDelayed(b);
        if (aDelayed !== bDelayed) return aDelayed ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    },
    [projectDrafts, search, selectedFolder]
  );

  const visibleFolders = useMemo(
    () =>
      projectFolders
        .filter((folder) => {
          if (!selectedArea) return false;
          return (folder.areaName ?? "Sem área") === selectedArea;
        })
        .filter((folder) => {
          const term = search.trim().toLowerCase();
          if (!term) return true;
          return folder.name.toLowerCase().includes(term);
        })
        .map((folder) => {
          const folderDrafts = projectDrafts.filter(
            (draft) => (draft.folderName ?? "Sem pasta") === folder.name
          );
          const hasDelayedChecklist = folderDrafts.some((draft) => isDraftDelayed(draft));
          return { folder, hasDelayedChecklist };
        })
        .sort((a, b) => {
          if (a.hasDelayedChecklist !== b.hasDelayedChecklist) {
            return a.hasDelayedChecklist ? -1 : 1;
          }
          return a.folder.name.localeCompare(b.folder.name, "pt-BR");
        }),
    [projectFolders, projectDrafts, search, selectedArea]
  );

  const visibleAreas = useMemo(
    () =>
      projectAreas
        .filter((area) => {
          const term = search.trim().toLowerCase();
          if (!term) return true;
          return area.name.toLowerCase().includes(term);
        })
        .map((area) => {
          const areaFolders = projectFolders.filter(
            (folder) => (folder.areaName ?? "Sem área") === area.name
          );
          const areaFolderNames = new Set(areaFolders.map((folder) => folder.name));
          const hasDelayedChecklist = projectDrafts.some((draft) => {
            const draftFolder = draft.folderName ?? "Sem pasta";
            return areaFolderNames.has(draftFolder) && isDraftDelayed(draft);
          });
          return { area, totalDirectories: areaFolders.length, hasDelayedChecklist };
        })
        .sort((a, b) => {
          if (a.hasDelayedChecklist !== b.hasDelayedChecklist) {
            return a.hasDelayedChecklist ? -1 : 1;
          }
          return a.area.name.localeCompare(b.area.name, "pt-BR");
        }),
    [projectAreas, projectFolders, projectDrafts, search]
  );

  const getDraftProgress = (draft: ChecklistDraft) => {
    const activeQuestionKeys = getDraftActiveQuestionKeys(draft);

    const answeredKeys = activeQuestionKeys.filter((key) => {
      const value = draft.answers[key];
      if (!value) return false;

      // Pergunta específica "Houve vazamento no sistema?" -> finalChecks:final_leak
      if (key === "finalChecks:final_leak") {
        return value === "no"; // "Não" conta como concluído/ok
      }

      // Demais perguntas: apenas "yes" conta como concluído
      return value === "yes";
    });
    if (activeQuestionKeys.length === 0) return 0;

    return answeredKeys.length / activeQuestionKeys.length;
  };

  const handleNovoComissionamento = () => {
    if (!selectedFolder) {
      setFolderModalVisible(true);
      return;
    }
    setModalVisible(true);
  };

  const handleOpenDraft = (id: string) => {
    if (!user) return;

    const draft = checklistDrafts.find((d) => d.id === id);

    router.push({
      pathname: "/commissioning-checklist",
      params: {
        draftId: id,
        projectName: draft?.projectName ?? currentProject,
        routeName: draft?.routeName,
        folderName: draft?.folderName,
        startDate: draft?.startDate,
        endDate: draft?.endDate,
      },
    });
  };

  const confirmDeleteArea = (areaId: string, area: string) => {
    Alert.alert(
      "Excluir área",
      `Deseja realmente excluir a área "${area}"? Esta ação removerá também os diretórios e checklists vinculados.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const cleanupErrors: string[] = [];
            try {
              if (selectedArea === area) {
                setSelectedArea(null);
                setSelectedFolder(null);
              }

              const areaFolders = projectFolders.filter(
                (folder) => (folder.areaName ?? "Sem área") === area
              );

              for (const folder of areaFolders) {
                try {
                  await deleteDraftsByFolder(folder.name, currentProject ?? undefined);
                } catch (error) {
                  console.error("Falha ao excluir drafts vinculados da área:", error);
                  cleanupErrors.push("drafts");
                }

                try {
                  await deleteForwardedByFolder(folder.name, currentProject ?? undefined);
                } catch (error) {
                  console.error("Falha ao excluir concluídos vinculados da área:", error);
                  cleanupErrors.push("concluidos");
                }

                try {
                  await deleteFolder(folder.id);
                } catch (error) {
                  console.error("Falha ao excluir diretório da área:", error);
                  cleanupErrors.push("diretorios");
                }
              }

              await deleteArea(areaId);

              if (cleanupErrors.length > 0) {
                Alert.alert(
                  "Área excluída com pendências",
                  "A área foi removida, mas alguns itens vinculados não puderam ser limpos automaticamente por permissão."
                );
              }
            } catch (error) {
              console.error("Erro ao excluir área e itens vinculados:", error);
              Alert.alert(
                "Erro ao excluir área",
                "Não foi possível excluir a área. Verifique se ela pertence ao seu usuário."
              );
            }
          },
        },
      ]
    );
  };

  const confirmDeleteFolder = (folderId: string, folderName: string) => {
    Alert.alert(
      "Excluir diretório",
      `Deseja realmente excluir o diretório "${folderName}"? Esta ação removerá também os checklists e ações corretivas vinculados a este diretório.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const cleanupErrors: string[] = [];
            try {
              if (selectedFolder === folderName) {
                setSelectedFolder(null);
              }
              try {
                await deleteDraftsByFolder(folderName, currentProject ?? undefined);
              } catch (error) {
                console.error("Falha ao excluir drafts vinculados:", error);
                cleanupErrors.push("drafts");
              }

              try {
                await deleteForwardedByFolder(folderName, currentProject ?? undefined);
              } catch (error) {
                console.error("Falha ao excluir concluídos/ações vinculados:", error);
                cleanupErrors.push("concluidos");
              }

              await deleteFolder(folderId);

              if (cleanupErrors.length > 0) {
                Alert.alert(
                  "Diretório excluído com pendências",
                  "O diretório foi removido, mas alguns itens vinculados não puderam ser limpos automaticamente por permissão."
                );
              }
            } catch (error) {
              console.error("Erro ao excluir diretório e itens vinculados:", error);
              Alert.alert(
                "Erro ao excluir diretório",
                "Não foi possível excluir o diretório. Verifique se ele pertence ao seu usuário."
              );
            }
          },
        },
      ]
    );
  };

  const confirmDeleteDraft = (draftId: string, draftName: string) => {
    Alert.alert(
      "Excluir checklist",
      `Deseja realmente excluir o checklist "${draftName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteDraft(draftId);
          },
        },
      ]
    );
  };

  const openCalendar = (field: "start" | "end") => {
    const current = field === "start" ? selectedStartDate : selectedEndDate;
    const month = current
      ? new Date(current.getFullYear(), current.getMonth(), 1)
      : (() => { const d = new Date(); d.setDate(1); return d; })();
    setCalendarMonth(month);
    setCalendarShowing(field);
  };

  const handleCalendarSelectDate = (day: number | null) => {
    if (!day) return;
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    if (calendarShowing === "start") {
      setSelectedStartDate(d);
    } else {
      setSelectedEndDate(d);
    }
    setCalendarShowing(null);
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {selectedFolder ? (
          <>
            <View style={styles.folderHeaderRow}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedFolder(null);
                  setSearch("");
                }}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.currentFolderTitle}>{selectedFolder}</Text>
              {!isReader && (
                <TouchableOpacity
                  onPress={handleNovoComissionamento}
                  style={styles.headerIconButton}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por projeto ou rota"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.listContainer}>
              {filteredDrafts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="clipboard" size={40} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>Nenhum checklist neste diretório</Text>
                  <Text style={styles.emptySubtitle}>
                    {isReader
                      ? "Este diretório ainda não possui checklists."
                      : "Toque no ícone \"+\" para criar um novo checklist neste diretório."}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Checklists no diretório</Text>
                  {filteredDrafts.map((draft) => {
                    const progress = getDraftProgress(draft);
                    const pctLabel = `${Math.round(progress * 100)}%`;
                    const draftName = draft.routeName || "Checklist sem nome";
                    const status = getDraftChecklistStatus(draft);
                    const statusMeta = DRAFT_STATUS_META[status];

                    return (
                      <TouchableOpacity
                        key={draft.id}
                        style={styles.draftCard}
                        activeOpacity={0.85}
                        onPress={() => handleOpenDraft(draft.id)}
                      >
                        <View style={styles.draftHeader}>
                          <Text style={styles.draftTitle} numberOfLines={1}>
                            {draftName}
                          </Text>
                          <View style={styles.draftHeaderRight}>
                            <Animated.View
                              style={[
                                styles.draftStatusBadge,
                                { backgroundColor: statusMeta.backgroundColor },
                                status === "warning" && {
                                  transform: [{ scale: delayedPulseAnim }],
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.draftStatusDot,
                                  { backgroundColor: statusMeta.dotColor },
                                ]}
                              />
                              <Text
                                style={[styles.draftStatusText, { color: statusMeta.textColor }]}
                              >
                                {statusMeta.label}
                              </Text>
                            </Animated.View>
                            <Text style={styles.draftDate}>
                              {new Date(draft.updatedAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            {!isReader && (
                              <TouchableOpacity
                                onPress={() => confirmDeleteDraft(draft.id, draftName)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.draftDeleteButton}
                              >
                                <Feather name="trash-2" size={16} color="#dc2626" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <Text style={styles.draftMeta}>
                          {draft.equipmentIds.length} equipamento(s) •{" "}
                          {Object.keys(draft.answers).length} resposta(s)
                        </Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                            />
                          </View>
                          <Text style={styles.progressLabel}>{pctLabel}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          </>
        ) : selectedArea ? (
          <>
            <View style={styles.folderHeaderRow}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedArea(null);
                  setSearch("");
                }}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.currentFolderTitle}>{selectedArea}</Text>
              {!isReader && (
                <TouchableOpacity
                  onPress={() => setFolderModalVisible(true)}
                  style={styles.headerIconButton}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar diretório"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.listContainer}>
              {visibleFolders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="folder" size={40} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>Nenhum diretório nesta área</Text>
                  <Text style={styles.emptySubtitle}>
                    {isReader
                      ? "Ainda não há diretórios criados nesta área."
                      : "Toque no ícone \"+\" no canto superior direito para criar um novo diretório."}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Diretórios</Text>
                  {visibleFolders.map(({ folder, hasDelayedChecklist }) => {
                      const folderDrafts = projectDrafts.filter(
                        (draft) => (draft.folderName ?? "Sem pasta") === folder.name
                      );
                      const folderCompletedChecklists = projectCompletedChecklists.filter(
                        (item) => (item.folderName ?? "Sem pasta") === folder.name
                      );
                      const totalChecklists = folderDrafts.length + folderCompletedChecklists.length;
                      const folderProgress =
                        totalChecklists > 0
                          ? (folderDrafts.reduce((acc, draft) => acc + getDraftProgress(draft), 0) +
                              folderCompletedChecklists.length) /
                            totalChecklists
                          : 0;
                      const folderProgressPct = `${Math.round(folderProgress * 100)}%`;

                      // Calcula data de início (menor startDate) e data de fim (maior endDate)
                      const datesWithStart = [
                        ...folderDrafts.map((d) => d.startDate),
                        ...folderCompletedChecklists.map((item) => item.startDate),
                      ]
                        .filter((d): d is string => !!d)
                        .sort();
                      const datesWithEnd = [
                        ...folderDrafts.map((d) => d.endDate),
                        ...folderCompletedChecklists.map((item) => item.endDate),
                      ]
                        .filter((d): d is string => !!d)
                        .sort();
                      const folderStartDate = datesWithStart[0];
                      const folderEndDate = datesWithEnd[datesWithEnd.length - 1];

                      return (
                        <TouchableOpacity
                          key={folder.id}
                          style={styles.folderCard}
                          activeOpacity={0.85}
                          onPress={() => setSelectedFolder(folder.name)}
                        >
                          <View style={styles.folderHeader}>
                            <View style={styles.folderIconWrapper}>
                              <Feather name="folder" size={20} color="#1a472a" />
                            </View>
                            <View style={styles.folderInfo}>
                              <Text style={styles.folderTitle}>{folder.name}</Text>
                              <Text style={styles.folderMeta}>{totalChecklists} checklist(s)</Text>
                              <View style={styles.folderDatesRow}>
                                {folderStartDate ? (
                                  <Text style={styles.folderDateText}>
                                    Início: {new Date(folderStartDate).toLocaleDateString("pt-BR")}
                                  </Text>
                                ) : (
                                  <Text style={styles.folderDateText}>Início: —</Text>
                                )}
                                {folderEndDate ? (
                                  <Text style={styles.folderDateText}>
                                    Fim: {new Date(folderEndDate).toLocaleDateString("pt-BR")}
                                  </Text>
                                ) : (
                                  <Text style={styles.folderDateText}>Fim: —</Text>
                                )}
                              </View>
                              <View style={styles.folderProgressContainer}>
                                <View style={styles.folderProgressBar}>
                                  <View
                                    style={[
                                      styles.folderProgressBarFill,
                                      { width: `${folderProgress * 100}%` },
                                    ]}
                                  />
                                </View>
                                <Text style={styles.folderProgressLabel}>{folderProgressPct}</Text>
                              </View>
                            </View>
                            <View style={styles.folderHeaderActions}>
                              {hasDelayedChecklist && (
                                <Animated.View
                                  style={[
                                    styles.folderWarningBadge,
                                    { transform: [{ scale: delayedPulseAnim }] },
                                  ]}
                                >
                                  <Feather name="alert-triangle" size={12} color="#92400e" />
                                  <Text style={styles.folderWarningText}>Atraso</Text>
                                </Animated.View>
                              )}
                              {!isReader && (
                                <TouchableOpacity
                                  style={styles.folderDeleteButton}
                                  onPress={() => confirmDeleteFolder(folder.id, folder.name)}
                                  activeOpacity={0.8}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Feather name="trash-2" size={18} color="#dc2626" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar área"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {!isReader && (
                <TouchableOpacity
                  onPress={() => setAreaModalVisible(true)}
                  style={styles.headerIconButton}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.listContainer}>
              {visibleAreas.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="grid" size={40} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>Nenhuma área encontrada</Text>
                  <Text style={styles.emptySubtitle}>
                    {isReader
                      ? "Ainda não há áreas criadas para este projeto."
                      : "Toque no ícone \"+\" para criar uma área."}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Áreas</Text>
                  {visibleAreas.map(({ area, totalDirectories, hasDelayedChecklist }) => (
                    <TouchableOpacity
                      key={area.id}
                      style={styles.folderCard}
                      activeOpacity={0.85}
                      onPress={() => setSelectedArea(area.name)}
                    >
                      <View style={styles.folderHeader}>
                        <View style={styles.folderIconWrapper}>
                          <Feather name="grid" size={20} color="#1a472a" />
                        </View>
                        <View style={styles.folderInfo}>
                          <Text style={styles.folderTitle}>{area.name}</Text>
                          <Text style={styles.folderMeta}>{totalDirectories} diretório(s)</Text>
                        </View>
                        <View style={styles.folderHeaderActions}>
                          {hasDelayedChecklist && (
                            <Animated.View
                              style={[
                                styles.folderWarningBadge,
                                { transform: [{ scale: delayedPulseAnim }] },
                              ]}
                            >
                              <Feather name="alert-triangle" size={12} color="#92400e" />
                              <Text style={styles.folderWarningText}>Atraso</Text>
                            </Animated.View>
                          )}
                          {!isReader && (
                            <TouchableOpacity
                              style={styles.folderDeleteButton}
                              onPress={() => confirmDeleteArea(area.id, area.name)}
                              activeOpacity={0.8}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Feather name="trash-2" size={18} color="#dc2626" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setCalendarShowing(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {calendarShowing ? (
              <>
                <Text style={styles.modalTitle}>
                  {calendarShowing === "start" ? "Data de início" : "Data de fim"}
                </Text>

                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => setCalendarMonth((prev) => {
                      const d = new Date(prev);
                      d.setMonth(d.getMonth() - 1);
                      return d;
                    })}
                    style={styles.calendarNavBtn}
                  >
                    <Text style={styles.calendarNavText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.calendarHeaderTitle}>
                    {calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCalendarMonth((prev) => {
                      const d = new Date(prev);
                      d.setMonth(d.getMonth() + 1);
                      return d;
                    })}
                    style={styles.calendarNavBtn}
                  >
                    <Text style={styles.calendarNavText}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekRow}>
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, idx) => (
                    <Text key={`${d}-${idx}`} style={styles.calendarWeekDay}>{d}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells: (number | null)[] = [
                      ...Array(firstDay).fill(null),
                      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                    ];
                    while (cells.length % 7 !== 0) cells.push(null);
                    const activeDate = calendarShowing === "start" ? selectedStartDate : selectedEndDate;
                    return cells.map((day, idx) => {
                      const cellKey = `cal-${idx}`;
                      if (!day) return <View key={cellKey} style={styles.calendarDayCell} />;
                      const cellDate = new Date(year, month, day);
                      const isSelected = activeDate &&
                        cellDate.getFullYear() === activeDate.getFullYear() &&
                        cellDate.getMonth() === activeDate.getMonth() &&
                        cellDate.getDate() === activeDate.getDate();
                      return (
                        <TouchableOpacity
                          key={cellKey}
                          style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected]}
                          onPress={() => handleCalendarSelectDate(day)}
                        >
                          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setCalendarShowing(null)}>
                    <Text style={styles.modalCancelText}>Voltar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Novo comissionamento</Text>

                <Text style={styles.modalLabel}>Projeto selecionado</Text>
                <Text style={styles.modalSelectedProject}>{currentProject}</Text>

                <Text style={styles.modalLabel}>Nome da Rota</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Informe o nome da rota"
                  placeholderTextColor="#9CA3AF"
                  value={routeName}
                  onChangeText={setRouteName}
                />

                <Text style={styles.modalLabel}>Data de início</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => openCalendar("start")}
                  activeOpacity={0.8}
                >
                  <Feather name="calendar" size={16} color="#6b7280" />
                  <Text style={[styles.datePickerText, !selectedStartDate && styles.datePickerPlaceholder]}>
                    {selectedStartDate ? formatDateDisplay(selectedStartDate) : "Selecionar data de início"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.modalLabel}>Data de fim</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => openCalendar("end")}
                  activeOpacity={0.8}
                >
                  <Feather name="calendar" size={16} color="#6b7280" />
                  <Text style={[styles.datePickerText, !selectedEndDate && styles.datePickerPlaceholder]}>
                    {selectedEndDate ? formatDateDisplay(selectedEndDate) : "Selecionar data de fim"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => {
                      setModalVisible(false);
                      setRouteName("");
                      setSelectedStartDate(null);
                      setSelectedEndDate(null);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalConfirm,
                      !routeName.trim() && styles.modalConfirmDisabled,
                    ]}
                    disabled={!routeName.trim()}
                    onPress={() => {
                      const trimmedRoute = routeName.trim();
                      const startIso = selectedStartDate ? selectedStartDate.toISOString() : undefined;
                      const endIso = selectedEndDate ? selectedEndDate.toISOString() : undefined;
                      setModalVisible(false);
                      setRouteName("");
                      setSelectedStartDate(null);
                      setSelectedEndDate(null);
                      router.push({
                        pathname: "/commissioning-checklist",
                        params: {
                          projectName: currentProject,
                          routeName: trimmedRoute,
                          startDate: startIso || undefined,
                          endDate: endIso || undefined,
                          folderName: selectedFolder ?? undefined,
                        },
                      });
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={folderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo diretório</Text>

            <Text style={styles.modalLabel}>Nome do diretório</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Informe o nome do diretório"
              placeholderTextColor="#9CA3AF"
              value={newFolderName}
              onChangeText={setNewFolderName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setFolderModalVisible(false);
                  setNewFolderName("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  !newFolderName.trim() && styles.modalConfirmDisabled,
                ]}
                disabled={!newFolderName.trim()}
                onPress={async () => {
                  const trimmed = newFolderName.trim();
                  setFolderModalVisible(false);
                  setNewFolderName("");

                  try {
                    const created = await createFolder({
                      projectName: currentProject ?? undefined,
                      areaName: selectedArea ?? undefined,
                      name: trimmed,
                    });
                    if (created) {
                      setSelectedFolder(created.name);
                    }
                  } catch (error) {
                    console.error("Erro ao criar diretório:", error);
                    Alert.alert(
                      "Erro ao criar diretório",
                      "Não foi possível criar o diretório. Verifique suas permissões no Firestore."
                    );
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Criar diretório</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={areaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAreaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova área</Text>

            <Text style={styles.modalLabel}>Nome da área</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Informe o nome da área"
              placeholderTextColor="#9CA3AF"
              value={newAreaName}
              onChangeText={setNewAreaName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setAreaModalVisible(false);
                  setNewAreaName("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  !newAreaName.trim() && styles.modalConfirmDisabled,
                ]}
                disabled={!newAreaName.trim()}
                onPress={async () => {
                  const trimmed = newAreaName.trim();
                  setAreaModalVisible(false);
                  setNewAreaName("");

                  try {
                    const created = await createArea({
                      projectName: currentProject ?? undefined,
                      name: trimmed,
                    });
                    if (created) {
                      setSelectedArea(created.name);
                    }
                  } catch (error) {
                    console.error("Erro ao criar área:", error);
                    Alert.alert(
                      "Erro ao criar área",
                      "Não foi possível criar a área. Verifique suas permissões no Firestore."
                    );
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Criar área</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  headerIconButton: {
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  folderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  backButtonText: {
    fontSize: 18,
    color: "#374151",
  },
  currentFolderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2933",
    marginBottom: 8,
  },
  folderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  folderIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ecfdf3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  folderInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  folderHeaderActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 0,
    gap: 6,
    paddingTop: 1,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  folderMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  folderDatesRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 8,
    rowGap: 4,
    columnGap: 14,
  },
  folderDateText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    flexShrink: 1,
    maxWidth: "100%",
  },
  folderProgressContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  folderProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  folderProgressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#16a34a",
  },
  folderProgressLabel: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  folderDeleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  folderWarningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  folderWarningText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600",
  },
  draftCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  draftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  draftHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  draftStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  draftStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  draftStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  draftDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  draftDeleteButton: {
    padding: 2,
  },
  draftMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#16a34a",
  },
  progressLabel: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
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
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  modalSelectedProject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1a472a",
    borderRadius: 999,
  },
  modalConfirmDisabled: {
    backgroundColor: "#9ca3af",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  datePickerPlaceholder: {
    color: "#9CA3AF",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textTransform: "capitalize",
  },
  calendarNavBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calendarNavText: {
    fontSize: 18,
    color: "#374151",
  },
  calendarWeekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    marginVertical: 2,
  },
  calendarDayText: {
    fontSize: 13,
    color: "#111827",
  },
  calendarDaySelected: {
    backgroundColor: "#16a34a",
  },
  calendarDayTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

