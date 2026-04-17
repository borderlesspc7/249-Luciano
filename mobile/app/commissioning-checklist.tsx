import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useForwardedChecklists } from "../contexts/ForwardedChecklistsContext";
import { useChecklistDrafts } from "../contexts/ChecklistDraftsContext";
import { useProject } from "../contexts/ProjectContext";
import { useAuth } from "../hooks/useAuth";

type AnswerValue = "yes" | "no";

type ChecklistQuestion = {
  id: string;
  text: string;
};

type ChecklistItem = {
  id: string;
  title: string;
  instrumentType?: string;
  questions: ChecklistQuestion[];
};

type ChecklistSection = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

type TopicStatus = "not_started" | "in_progress" | "delayed" | "completed";

const EQUIPMENTS = [
  "T-2030 (tanque 2030)",
  "P-2030B (bomba 2030B)",
  "P-2030C (bomba 2030C)",
  "T-2021A (tanque 2021A)",
  "T-2021B (tanque 2021B)",
  "A-2021A (agitador 2021A)",
  "A-2021B (agitador 2021B)",
];

const XV_CODES = [
  "XV-2030.6",
  "XV-2030B.2",
  "XV-2030B",
  "XV-2030C.2",
  "XV-2030C.1",
  "XV-2021A.15",
  "XV-2021A.16",
  "XV-2021B.15",
  "XV-2021B.16",
];

const TIT_CODES = ["TIT-2030"];

const LSH_CODES = ["LSH-2030", "LSH-2031", "LSH-2021A", "LSH-2021B"];

const FIT_CODES = ["FIT-2030B", "FIT-2030C"];

const HV_CODES = ["HV-2030", "HV-2030B", "HV-2030C", "HV-2030B.2", "HV-2030C.2"];

const XZV_CODES = ["XZV-2021A.9", "XZV-2021B.9"];

const WE_CODES = ["WE-2030", "WE-2031", "WE-2021A", "WE-2021B"];

const PIT_CODES = ["PIT-2030B", "PIT-2030C", "PIT-2021A.4", "PIT-2021B.4"];

function buildQuestionsForEquipment(name: string): ChecklistQuestion[] {
  const baseId = name.replace(/[^a-zA-Z0-9]/g, "_");
  return [
    {
      id: `${baseId}_installed_ok`,
      text: `O equipamento ${name} foi instalado corretamente (posicionamento, fixação e conexões)?`,
    },
    {
      id: `${baseId}_leak_ok`,
      text: `Não há vazamentos visíveis ou anomalias aparentes no equipamento ${name}?`,
    },
    {
      id: `${baseId}_operation_ok`,
      text: `O equipamento ${name} operou conforme o esperado durante o teste de comissionamento?`,
    },
  ];
}

function buildQuestionsForCode(
  code: string,
  type: "XV" | "XZV" | "TIT" | "LSH" | "FIT" | "WE" | "PIT"
): ChecklistQuestion[] {
  const baseId = code.replace(/[^a-zA-Z0-9]/g, "_");

  switch (type) {
    case "XV":
    case "XZV":
      return [
        {
          id: `${baseId}_open`,
          text: `A válvula automática ${code} abriu?`,
        },
        {
          id: `${baseId}_close`,
          text: `A válvula automática ${code} fechou?`,
        },
      ];
    case "TIT":
      return [
        {
          id: `${baseId}_temp_ok`,
          text: `O sensor de temperatura ${code} está marcando a temperatura corretamente?`,
        },
        {
          id: `${baseId}_range_ok`,
          text: `O sensor de temperatura ${code} está com range de calibração adequado?`,
        },
      ];
    case "LSH":
      return [
        {
          id: `${baseId}_level_ok`,
          text: `A chave de nível ${code} realizou leitura de nível corretamente?`,
        },
        {
          id: `${baseId}_range_ok`,
          text: `A chave de nível ${code} está com range de calibração adequado?`,
        },
      ];
    case "FIT":
      return [
        {
          id: `${baseId}_flow_ok`,
          text: `O transmissor de fluxo ${code} está fazendo leitura de fluxo corretamente?`,
        },
        {
          id: `${baseId}_range_ok`,
          text: `O transmissor de fluxo ${code} está com range de calibração adequado?`,
        },
      ];
    case "WE":
      return [
        {
          id: `${baseId}_weight_ok`,
          text: `A célula de carga ${code} apresentou leitura de peso corretamente?`,
        },
        {
          id: `${baseId}_range_ok`,
          text: `O range de calibração da célula de carga ${code} está adequado?`,
        },
      ];
    case "PIT":
      return [
        {
          id: `${baseId}_pressure_ok`,
          text: `O transmissor de pressão ${code} está fazendo leitura de pressão corretamente?`,
        },
        {
          id: `${baseId}_range_ok`,
          text: `O range de calibração do transmissor de pressão ${code} está adequado?`,
        },
      ];
    default:
      return [];
  }
}

const SECTIONS: ChecklistSection[] = [
  {
    id: "xv",
    title: "Válvulas automáticas – XV's",
    items: XV_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "XV",
      questions: buildQuestionsForCode(code, "XV"),
    })),
  },
  {
    id: "xzv",
    title: "Válvulas automáticas de segurança – XZV's",
    items: XZV_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "XZV",
      questions: buildQuestionsForCode(code, "XZV"),
    })),
  },
  {
    id: "tit",
    title: "Sensores de temperatura – TIT",
    items: TIT_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "TIT",
      questions: buildQuestionsForCode(code, "TIT"),
    })),
  },
  {
    id: "lsh",
    title: "Chaves de nível – LSH",
    items: LSH_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "LSH",
      questions: buildQuestionsForCode(code, "LSH"),
    })),
  },
  {
    id: "fit",
    title: "Transmissores de fluxo – FIT",
    items: FIT_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "FIT",
      questions: buildQuestionsForCode(code, "FIT"),
    })),
  },
  {
    id: "we",
    title: "Sensores de carga – WE",
    items: WE_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "WE",
      questions: buildQuestionsForCode(code, "WE"),
    })),
  },
  {
    id: "pit",
    title: "Transmissores de pressão – PIT",
    items: PIT_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "PIT",
      questions: buildQuestionsForCode(code, "PIT"),
    })),
  },
  {
    id: "hv",
    title: "Válvulas manuais – HV's",
    items: HV_CODES.map((code) => ({
      id: code,
      title: code,
      instrumentType: "HV",
      questions: [
        {
          id: `${code.replace(/[^a-zA-Z0-9]/g, "_")}_open`,
          text: `A válvula manual ${code} abriu e fechou adequadamente?`,
        },
      ],
    })),
  },
  {
    id: "finalChecks",
    title: "Verificações finais",
    items: [
      {
        id: "final",
        title: "Checklist geral do sistema",
        questions: [
          {
            id: "final_leak",
            text: "Houve vazamento no sistema?",
          },
          {
            id: "final_supervisory",
            text: "O supervisório funcionou adequadamente?",
          },
        ],
      },
    ],
  },
];

const OPTIONAL_SECTIONS = SECTIONS.filter((section) => section.id !== "finalChecks");
const FINAL_SECTION = SECTIONS.find((section) => section.id === "finalChecks") ?? null;

const TOPIC_STATUS_META: Record<
  TopicStatus,
  { label: string; backgroundColor: string; textColor: string; dotColor: string }
> = {
  not_started: {
    label: "Nao iniciado",
    backgroundColor: "#e5e7eb",
    textColor: "#4b5563",
    dotColor: "#9ca3af",
  },
  in_progress: {
    label: "Em andamento",
    backgroundColor: "#fef3c7",
    textColor: "#92400e",
    dotColor: "#f59e0b",
  },
  delayed: {
    label: "Atrasado",
    backgroundColor: "#fee2e2",
    textColor: "#991b1b",
    dotColor: "#dc2626",
  },
  completed: {
    label: "Concluido",
    backgroundColor: "#dcfce7",
    textColor: "#166534",
    dotColor: "#16a34a",
  },
};

function findQuestionLabelFromKey(
  questionKey: string,
  equipments: string[]
): string | undefined {
  const parts = questionKey.split(":");
  const baseId = parts[parts.length - 1] ?? questionKey;

  for (const section of SECTIONS) {
    for (const item of section.items) {
      const q = item.questions.find((question) => question.id === baseId);
      if (q) return q.text;
    }
  }

  for (const eq of equipments) {
    const eqQuestions = buildQuestionsForEquipment(eq);
    const q = eqQuestions.find((question) => question.id === baseId);
    if (q) return q.text;
  }

  return undefined;
}

function buildAllQuestionLabels(
  answerKeys: string[],
  equipments: string[]
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of answerKeys) {
    const label = findQuestionLabelFromKey(key, equipments);
    if (label) labels[key] = label;
  }
  return labels;
}

function getSectionIdFromQuestionKey(questionKey: string): string {
  if (questionKey.startsWith("equipment:")) {
    const parts = questionKey.split(":");
    return `${parts[0]}:${parts[1]}:${parts[2]}`;
  }
  if (questionKey.startsWith("finalChecks:")) {
    return "finalChecks";
  }
  // Instrument instance keys: sectionId:code:count:questionId -> return sectionId:code:count
  const parts = questionKey.split(":");
  if (parts.length >= 3) {
    return `${parts[0]}:${parts[1]}:${parts[2]}`;
  }
  return parts[0] ?? questionKey;
}

export { buildAllQuestionLabels, findQuestionLabelFromKey, SECTIONS, buildQuestionsForEquipment };

export default function CommissioningChecklistScreen() {
  const router = useRouter();
  const { projectName, routeName, draftId, focusQuestionKey, startDate, endDate, folderName } =
    useLocalSearchParams<{
    projectName?: string;
    routeName?: string;
    draftId?: string;
    focusQuestionKey?: string;
      startDate?: string;
      endDate?: string;
      folderName?: string;
  }>();
  const { user } = useAuth();
  const isReader = user?.role === "reader";
  const { addForwarded } = useForwardedChecklists();
  const { items: draftItems, saveDraft, deleteDraft } = useChecklistDrafts();
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [questionResponsibles, setQuestionResponsibles] = useState<Record<string, string>>({});
  const [questionPriorities, setQuestionPriorities] = useState<
    Record<string, "P1" | "P2" | "P3">
  >({});
  const [questionDeadlines, setQuestionDeadlines] = useState<Record<string, string>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [instrumentInstances, setInstrumentInstances] = useState<
    Array<{ instanceId: string; sectionId: string; itemId: string }>
  >([]);
  const [commentModalQuestionId, setCommentModalQuestionId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentResponsibleDraft, setCommentResponsibleDraft] = useState("");
  const [commentPriorityDraft, setCommentPriorityDraft] = useState<"P1" | "P2" | "P3" | null>(
    null
  );
  const [commentPriorityDropdownOpen, setCommentPriorityDropdownOpen] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [activeTopicsIds, setActiveTopicsIds] = useState<string[]>([]);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"equipment" | "instrument">("equipment");
  const [selectedEquipmentGroup, setSelectedEquipmentGroup] = useState<
    "bombas" | "tanques" | "agitador" | null
  >(null);
  const [selectedInstrumentGroup, setSelectedInstrumentGroup] = useState<
    "chaves" | "pressao" | "solenoides" | null
  >(null);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [commentCalendarMonth, setCommentCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [commentSelectedDate, setCommentSelectedDate] = useState<Date | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(
    typeof draftId === "string" ? draftId : undefined
  );
  const currentDraft = useMemo(
    () => draftItems.find((d) => d.id === currentDraftId),
    [draftItems, currentDraftId]
  );
  const { currentProject } = useProject();

  /** Garante projeto/pasta/rota no Firestore mesmo quando os params da rota não repetem o rascunho */
  const effectiveProjectName = useMemo(() => {
    const fromParams =
      typeof projectName === "string" && projectName.trim() ? projectName.trim() : "";
    return (
      fromParams ||
      currentDraft?.projectName?.trim() ||
      currentProject?.trim() ||
      undefined
    );
  }, [projectName, currentDraft?.projectName, currentProject]);

  const effectiveFolderName = useMemo(() => {
    const fromParams =
      typeof folderName === "string" && folderName.trim() ? folderName.trim() : "";
    return fromParams || currentDraft?.folderName?.trim() || undefined;
  }, [folderName, currentDraft?.folderName]);

  const effectiveRouteName = useMemo(() => {
    const fromParams =
      typeof routeName === "string" && routeName.trim() ? routeName.trim() : "";
    return fromParams || currentDraft?.routeName?.trim() || undefined;
  }, [routeName, currentDraft?.routeName]);

  const [highlightedQuestionKey, setHighlightedQuestionKey] = useState<string | null>(null);
  const delayedPulseAnim = useRef(new Animated.Value(1)).current;

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const pendingScrollKey = useRef<string | null>(
    typeof focusQuestionKey === "string" ? focusQuestionKey : null
  );

  const onSectionLayout = useCallback((sectionId: string, event: LayoutChangeEvent) => {
    sectionPositions.current[sectionId] = event.nativeEvent.layout.y;

    if (pendingScrollKey.current) {
      const targetSection = getSectionIdFromQuestionKey(pendingScrollKey.current);
      if (targetSection === sectionId) {
        const yPos = event.nativeEvent.layout.y;
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: yPos, animated: true });
        }, 300);
        setHighlightedQuestionKey(pendingScrollKey.current);
        pendingScrollKey.current = null;
        setTimeout(() => setHighlightedQuestionKey(null), 3000);
      }
    }
  }, []);

  const buildQuestionKey = (...parts: string[]) => parts.join(":");

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

  const isPastDeadline = useCallback((deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  }, []);

  const getTopicStatus = useCallback(
    (questionKeys: string[]): TopicStatus => {
      if (questionKeys.length === 0) return "not_started";

      let answeredCount = 0;
      let allYes = true;
      let hasDelayedQuestion = false;

      questionKeys.forEach((key) => {
        const answer = answers[key];
        if (answer === "yes" || answer === "no") {
          answeredCount += 1;
        }

        if (answer !== "yes") {
          allYes = false;
        }

        if (answer === "no" && isPastDeadline(questionDeadlines[key])) {
          hasDelayedQuestion = true;
        }
      });

      if (answeredCount === 0) return "not_started";
      if (hasDelayedQuestion) return "delayed";
      if (allYes && answeredCount === questionKeys.length) return "completed";
      return "in_progress";
    },
    [answers, isPastDeadline, questionDeadlines]
  );

  const activeQuestionKeys = useMemo(() => {
    const keys: string[] = [];

    selectedEquipments.forEach((eq, index) => {
      const sectionId = `equipment:${eq}:${index}`;
      const questions = buildQuestionsForEquipment(eq);
      questions.forEach((q) => keys.push(buildQuestionKey(sectionId, q.id)));
    });

    instrumentInstances.forEach(({ instanceId, sectionId, itemId }) => {
      const section = OPTIONAL_SECTIONS.find((s) => s.id === sectionId);
      const item = section?.items.find((i) => i.id === itemId);
      if (item) {
        item.questions.forEach((q) =>
          keys.push(buildQuestionKey(instanceId, q.id))
        );
      }
    });

    if (FINAL_SECTION && (selectedEquipments.length > 0 || instrumentInstances.length > 0)) {
      FINAL_SECTION.items[0].questions.forEach((q) =>
        keys.push(buildQuestionKey("finalChecks", q.id))
      );
    }

    return keys;
  }, [selectedEquipments, instrumentInstances]);

  const hasAnyNoAnswer = useMemo(
    () =>
      activeQuestionKeys
        .filter((key) => !key.startsWith("finalChecks:"))
        .some((key) => answers[key] === "no"),
    [answers, activeQuestionKeys]
  );

  const allQuestionsAnswered = useMemo(
    () =>
      activeQuestionKeys.length > 0 &&
      activeQuestionKeys.every((key) => answers[key] === "yes" || answers[key] === "no"),
    [answers, activeQuestionKeys]
  );

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return OPTIONAL_SECTIONS;
    }
    return OPTIONAL_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(term);
        const inQuestions = item.questions.some((q) =>
          q.text.toLowerCase().includes(term)
        );
        return inTitle || inQuestions;
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [search]);

  useEffect(() => {
    if (!currentDraftId) return;
    const draft = draftItems.find((d) => d.id === currentDraftId);
    if (!draft) return;

    setSelectedEquipments(draft.equipmentIds ?? []);
    setAnswers(draft.answers ?? {});
    setComments(draft.comments ?? {});
    setInstrumentInstances(draft.instrumentInstances ?? []);
    setActiveTopicsIds(draft.activeTopicsIds ?? []);
    setQuestionResponsibles(draft.questionResponsibles ?? {});
    setQuestionPriorities(draft.questionPriorities ?? {});
    setQuestionDeadlines(draft.questionDeadlines ?? {});

    if (typeof focusQuestionKey === "string" && focusQuestionKey) {
      const targetSection = getSectionIdFromQuestionKey(focusQuestionKey);
      setExpandedTopics((prev) => ({ ...prev, [targetSection]: true }));
    }
  }, [currentDraftId, draftItems]);

  const toggleTopic = (sectionId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSelectEquipment = (equipment: string) => {
    setSelectedEquipments((prev) => [...prev, equipment]);
  };

  const removeEquipment = (equipment: string, index: number) => {
    const sectionId = `equipment:${equipment}:${index}`;
    Alert.alert(
      "Remover equipamento",
      `Deseja realmente remover o equipamento "${equipment}" deste checklist?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            setSelectedEquipments((prev) => prev.filter((eq, idx) => !(eq === equipment && idx === index)));
            setAnswers((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(sectionId + ":")) {
                  next[key] = value as AnswerValue;
                }
              });
              return next;
            });
            setComments((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(sectionId + ":")) {
                  next[key] = value;
                }
              });
              return next;
            });
            setQuestionResponsibles((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(sectionId + ":")) {
                  next[key] = value;
                }
              });
              return next;
            });
            setQuestionPriorities((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(sectionId + ":")) {
                  next[key] = value;
                }
              });
              return next;
            });
            setQuestionDeadlines((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(sectionId + ":")) {
                  next[key] = value;
                }
              });
              return next;
            });
          },
        },
      ]
    );
  };

  const removeInstrumentSection = (instanceId: string, itemId: string) => {
    Alert.alert(
      "Remover instrumento",
      `Deseja realmente remover o instrumento "${itemId}" deste checklist?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            setInstrumentInstances((prev) =>
              prev.filter((inst) => inst.instanceId !== instanceId)
            );
            const prefix = `${instanceId}:`;
            setAnswers((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(prefix)) next[key] = value as AnswerValue;
              });
              return next;
            });
            setComments((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(prefix)) next[key] = value;
              });
              return next;
            });
            setQuestionResponsibles((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(prefix)) next[key] = value;
              });
              return next;
            });
            setQuestionPriorities((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(prefix)) next[key] = value;
              });
              return next;
            });
            setQuestionDeadlines((prev) => {
              const next: typeof prev = {};
              Object.entries(prev).forEach(([key, value]) => {
                if (!key.startsWith(prefix)) next[key] = value;
              });
              return next;
            });
          },
        },
      ]
    );
  };

  const handleAddTopic = () => {
    setAddMode("equipment");
    setSelectedEquipmentGroup(null);
    setSelectedInstrumentGroup(null);
    setEquipmentSearch("");
    setInstrumentSearch("");
    setTopicModalOpen(true);
  };

  const addInstrumentByCode = (group: "chaves" | "pressao" | "solenoides", code: string) => {
    let sectionId: string | null = null;

    if (group === "chaves") {
      sectionId = "lsh";
    } else if (group === "pressao") {
      sectionId = "pit";
    } else {
      if (XV_CODES.includes(code)) {
        sectionId = "xv";
      } else if (XZV_CODES.includes(code)) {
        sectionId = "xzv";
      } else if (HV_CODES.includes(code)) {
        sectionId = "hv";
      }
    }

    if (!sectionId) return;

    const resolvedSectionId = sectionId;
    setInstrumentInstances((prev) => {
      const count = prev.filter((i) => i.sectionId === resolvedSectionId && i.itemId === code).length;
      const instanceId = `${resolvedSectionId}:${code}:${count}`;
      return [...prev, { instanceId, sectionId: resolvedSectionId, itemId: code }];
    });
    setTopicModalOpen(false);
  };

  const saveResolvedAction = async (questionId: string) => {
    try {
      const questionLabels = buildAllQuestionLabels([questionId], selectedEquipments);
      const label = questionLabels[questionId] ?? questionId;
      const equipmentsSummary = selectedEquipments.join(", ");

      await addForwarded({
        equipmentId: `resolved:${questionId}`,
        equipmentName: label || equipmentsSummary || "Ação corretiva",
        kind: "resolved_action",
        checklistRefId: currentDraftId,
        answers: { [questionId]: "yes" },
        comments:
          comments[questionId] && comments[questionId].trim()
            ? { [questionId]: comments[questionId] }
            : {},
        instrumentInstances: [...instrumentInstances],
        activeTopicsIds: [],
        selectedBySection: {},
        responsible: questionResponsibles[questionId] ?? "",
        deadline: questionDeadlines[questionId] ?? undefined,
        priority: questionPriorities[questionId] ?? "P3",
        projectName: effectiveProjectName,
        routeName: effectiveRouteName,
        folderName: effectiveFolderName,
        startDate:
          (typeof startDate === "string" && startDate) || currentDraft?.startDate || undefined,
        endDate:
          (typeof endDate === "string" && endDate) || currentDraft?.endDate || undefined,
        questionLabels,
        questionResponsibles: questionResponsibles[questionId]
          ? { [questionId]: questionResponsibles[questionId] }
          : {},
        questionPriorities: questionPriorities[questionId]
          ? { [questionId]: questionPriorities[questionId] }
          : {},
        questionDeadlines: questionDeadlines[questionId]
          ? { [questionId]: questionDeadlines[questionId] }
          : {},
      });
    } catch (error) {
      console.error("Erro ao salvar ação corretiva resolvida:", error);
    }
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => {
      const previous = prev[questionId];
      const next = { ...prev, [questionId]: value };

      if (previous === "no" && value === "yes") {
        // Ação corretiva resolvida: salva imediatamente em "Concluídos -> Ações resolvidas"
        void saveResolvedAction(questionId);
      }

      return next;
    });
  };

  const openCommentModal = (questionId: string) => {
    setCommentModalQuestionId(questionId);
    setCommentDraft(comments[questionId] ?? "");
    setCommentResponsibleDraft(questionResponsibles[questionId] ?? "");
    setCommentPriorityDraft(questionPriorities[questionId] ?? null);
    setCommentPriorityDropdownOpen(false);
    const existingDeadline = questionDeadlines[questionId];
    if (existingDeadline) {
      const d = new Date(existingDeadline);
      setCommentSelectedDate(d);
      const m = new Date(d);
      m.setDate(1);
      setCommentCalendarMonth(m);
    } else {
      setCommentSelectedDate(null);
      const m = new Date();
      m.setDate(1);
      setCommentCalendarMonth(m);
    }
  };

  const saveComment = () => {
    if (commentModalQuestionId) {
      setComments((prev) => ({
        ...prev,
        [commentModalQuestionId]: commentDraft.trim(),
      }));
      setQuestionResponsibles((prev) => ({
        ...prev,
        [commentModalQuestionId]: commentResponsibleDraft.trim(),
      }));
      if (commentPriorityDraft) {
        setQuestionPriorities((prev) => ({
          ...prev,
          [commentModalQuestionId]: commentPriorityDraft,
        }));
      }
      if (commentSelectedDate) {
        setQuestionDeadlines((prev) => ({
          ...prev,
          [commentModalQuestionId]: commentSelectedDate.toISOString(),
        }));
      }
      setCommentModalQuestionId(null);
      setCommentDraft("");
      setCommentResponsibleDraft("");
      setCommentPriorityDraft(null);
      setCommentPriorityDropdownOpen(false);
      setCommentSelectedDate(null);
    }
  };

  const closeCommentModal = () => {
    setCommentModalQuestionId(null);
    setCommentDraft("");
    setCommentResponsibleDraft("");
    setCommentPriorityDraft(null);
    setCommentPriorityDropdownOpen(false);
    setCommentSelectedDate(null);
  };

  const handleCompleteRoute = async () => {
    if (selectedEquipments.length === 0 && instrumentInstances.length === 0) return;
    if (!allQuestionsAnswered) return;
    if (hasAnyNoAnswer) return;
    if (isForwarding) return;

    setIsForwarding(true);

    const questionLabels = buildAllQuestionLabels(Object.keys(answers), selectedEquipments);

    try {
      const equipmentSummary = selectedEquipments.join(", ");

      await addForwarded({
        equipmentId: equipmentSummary,
        equipmentName: equipmentSummary,
        kind: "checklist",
        checklistRefId: currentDraftId,
        answers: { ...answers },
        comments: { ...comments },
        instrumentInstances: [...instrumentInstances],
        activeTopicsIds: [],
        selectedBySection: {},
        responsible: "",
        deadline: new Date().toISOString(),
        priority: "P3",
        projectName: effectiveProjectName,
        routeName: effectiveRouteName,
        folderName: effectiveFolderName,
        startDate:
          (typeof startDate === "string" && startDate) || currentDraft?.startDate || undefined,
        endDate:
          (typeof endDate === "string" && endDate) || currentDraft?.endDate || undefined,
        questionLabels,
        questionResponsibles: { ...questionResponsibles },
        questionPriorities: { ...questionPriorities },
        questionDeadlines: { ...questionDeadlines },
      });

      if (currentDraftId) {
        await deleteDraft(currentDraftId);
        setCurrentDraftId(undefined);
      }

      setAnswers({});
      setComments({});
      setInstrumentInstances([]);
      setSelectedEquipments([]);
      setActiveTopicsIds([]);
      setQuestionResponsibles({});
      setQuestionPriorities({});
      setQuestionDeadlines({});
      router.replace("/(tabs)/completed-plans");
    } catch (error) {
      console.error("Erro ao concluir rota:", error);
      Alert.alert(
        "Erro ao concluir rota",
        "Não foi possível concluir o checklist. Verifique sua conexão e permissões no Firestore."
      );
    } finally {
      setIsForwarding(false);
    }
  };

  const goToPreviousMonth = () => {
    setCommentCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setCommentCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleSelectDate = (day: number | null) => {
    if (!day) return;
    const d = new Date(commentCalendarMonth);
    d.setDate(day);
    setCommentSelectedDate(d);
  };

  const [isForwarding, setIsForwarding] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
    if (isSavingDraft) return;

    try {
      setIsSavingDraft(true);
      const labels = buildAllQuestionLabels(Object.keys(answers), selectedEquipments);
      const draft = await saveDraft({
        id: currentDraftId,
        projectName: effectiveProjectName,
        routeName: effectiveRouteName,
        folderName: effectiveFolderName,
        startDate: typeof startDate === "string" && startDate ? startDate : undefined,
        endDate: typeof endDate === "string" && endDate ? endDate : undefined,
        equipmentIds: [...selectedEquipments],
        instrumentInstances: [...instrumentInstances],
        answers: { ...answers },
        comments: { ...comments },
        activeTopicsIds: [],
        selectedBySection: {},
        questionResponsibles: { ...questionResponsibles },
        questionPriorities: { ...questionPriorities },
        questionDeadlines: { ...questionDeadlines },
        questionLabels: labels,
      });
      if (draft && draft.id !== currentDraftId) {
        setCurrentDraftId(draft.id);
      }

      // Após salvar, voltar para a pasta atual de checklists (não para a lista de diretórios)
      router.replace({
        pathname: "/(tabs)/users",
        params: {
          folderName: typeof folderName === "string" ? folderName : undefined,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      Alert.alert(
        "Erro ao salvar",
        "Não foi possível salvar o checklist. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.topBarIcon}>‹</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Checklist de comissionamento</Text>
          <View style={styles.topBarIconPlaceholder} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {(projectName || routeName || startDate || endDate) && (
            <View style={styles.infoCard}>
              {projectName ? (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Projeto: </Text>
                  {projectName}
                </Text>
              ) : null}
              {routeName ? (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Rota: </Text>
                  {routeName}
                </Text>
              ) : null}
              {startDate ? (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Início: </Text>
                  {(() => {
                    try {
                      return new Date(startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
                    } catch {
                      return startDate;
                    }
                  })()}
                </Text>
              ) : null}
              {endDate ? (
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Fim: </Text>
                  {(() => {
                    try {
                      return new Date(endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
                    } catch {
                      return endDate;
                    }
                  })()}
                </Text>
              ) : null}
            </View>
          )}
          {selectedEquipments.length > 0 &&
            selectedEquipments.map((eq, index) => {
              const sectionId = `equipment:${eq}:${index}`;
              const questions = buildQuestionsForEquipment(eq);
              const isExpanded = expandedTopics[sectionId] ?? false;
              const topicQuestionKeys = questions.map((q) => buildQuestionKey(sectionId, q.id));
              const topicStatus = getTopicStatus(topicQuestionKeys);
              const topicStatusMeta = TOPIC_STATUS_META[topicStatus];
              return (
                <View
                  key={sectionId}
                  style={styles.sectionBlock}
                  onLayout={(e) => onSectionLayout(sectionId, e)}
                >
                  <Pressable
                    style={styles.topicHeader}
                    onPress={() => toggleTopic(sectionId)}
                  >
                    <Text style={styles.sectionTitle}>{eq}</Text>
                    <View style={styles.topicHeaderActions}>
                      <Animated.View
                        style={[
                          styles.topicStatusBadge,
                          { backgroundColor: topicStatusMeta.backgroundColor },
                          topicStatus === "delayed" && {
                            transform: [{ scale: delayedPulseAnim }],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.topicStatusDot,
                            { backgroundColor: topicStatusMeta.dotColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.topicStatusText,
                            { color: topicStatusMeta.textColor },
                          ]}
                        >
                          {topicStatusMeta.label}
                        </Text>
                      </Animated.View>
                      {!isReader && (
                        <TouchableOpacity
                          onPress={() => removeEquipment(eq, index)}
                          style={styles.deleteIconButton}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={18} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                      <Text style={styles.chevron}>{isExpanded ? "▼" : "▶"}</Text>
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.equipmentQuestionsWrapper}>
                      <View style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{eq}</Text>
                          <View style={styles.cardTag}>
                            <Text style={styles.cardTagText}>Equipamento</Text>
                          </View>
                        </View>
                        {questions.map((q) => {
                          const key = buildQuestionKey(sectionId, q.id);
                          return (
                            <View
                              key={q.id}
                              style={[
                                styles.questionBlock,
                                highlightedQuestionKey === key && styles.questionHighlight,
                              ]}
                            >
                              <Text style={styles.questionText}>{q.text}</Text>
                              <View style={styles.answerRow}>
                                <TouchableOpacity
                                  onPress={() => handleAnswerChange(key, "yes")}
                                  style={[
                                    styles.answerButton,
                                    styles.answerYes,
                                    answers[key] === "yes" && styles.answerYesSelected,
                                    isReader && styles.answerDisabled,
                                  ]}
                                  activeOpacity={0.8}
                                  disabled={isReader}
                                >
                                  <Text
                                    style={[
                                      styles.answerLabel,
                                      answers[key] === "yes" && styles.answerLabelSelected,
                                    ]}
                                  >
                                    Sim
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleAnswerChange(key, "no")}
                                  style={[
                                    styles.answerButton,
                                    styles.answerNo,
                                    answers[key] === "no" && styles.answerNoSelected,
                                    isReader && styles.answerDisabled,
                                  ]}
                                  activeOpacity={0.8}
                                  disabled={isReader}
                                >
                                  <Text
                                    style={[
                                      styles.answerLabel,
                                      answers[key] === "no" && styles.answerLabelSelected,
                                    ]}
                                  >
                                    Não
                                  </Text>
                                </TouchableOpacity>
                                {answers[key] === "no" && (
                                  <TouchableOpacity
                                    style={styles.commentIconBtn}
                                    onPress={() => openCommentModal(key)}
                                  >
                                    <Text style={styles.commentIcon}>💬</Text>
                                    {comments[key] ? (
                                      <View style={styles.commentBadge}>
                                        <Text style={styles.commentBadgeText}>1</Text>
                                      </View>
                                    ) : null}
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

          {instrumentInstances.map(({ instanceId, sectionId, itemId }) => {
              const section = OPTIONAL_SECTIONS.find((s) => s.id === sectionId);
              const selectedItem = section?.items.find((i) => i.id === itemId);
              if (!selectedItem) return null;

              const isExpanded = expandedTopics[instanceId] ?? false;
              const topicQuestionKeys = selectedItem.questions.map((q) => buildQuestionKey(instanceId, q.id));
              const topicStatus = getTopicStatus(topicQuestionKeys);
              const topicStatusMeta = TOPIC_STATUS_META[topicStatus];

              return (
                <View
                  key={instanceId}
                  style={styles.sectionBlock}
                  onLayout={(e) => onSectionLayout(instanceId, e)}
                >
                  <Pressable
                    style={styles.topicHeader}
                    onPress={() =>
                      setExpandedTopics((prev) => ({ ...prev, [instanceId]: !prev[instanceId] }))
                    }
                  >
                    <Text style={styles.sectionTitle}>{selectedItem.title}</Text>
                    <View style={styles.topicHeaderActions}>
                      <Animated.View
                        style={[
                          styles.topicStatusBadge,
                          { backgroundColor: topicStatusMeta.backgroundColor },
                          topicStatus === "delayed" && {
                            transform: [{ scale: delayedPulseAnim }],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.topicStatusDot,
                            { backgroundColor: topicStatusMeta.dotColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.topicStatusText,
                            { color: topicStatusMeta.textColor },
                          ]}
                        >
                          {topicStatusMeta.label}
                        </Text>
                      </Animated.View>
                      {!isReader && (
                        <TouchableOpacity
                          onPress={() => removeInstrumentSection(instanceId, selectedItem.title)}
                          style={styles.deleteIconButton}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={18} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                      <Text style={styles.chevron}>{isExpanded ? "▼" : "▶"}</Text>
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{selectedItem.title}</Text>
                        {selectedItem.instrumentType && (
                          <View style={styles.cardTag}>
                            <Text style={styles.cardTagText}>Instrumento</Text>
                          </View>
                        )}
                      </View>

                      {selectedItem.questions.map((q) => {
                        const key = buildQuestionKey(instanceId, q.id);
                        return (
                          <View
                            key={q.id}
                            style={[
                              styles.questionBlock,
                              highlightedQuestionKey === key && styles.questionHighlight,
                            ]}
                          >
                            <Text style={styles.questionText}>{q.text}</Text>
                            <View style={styles.answerRow}>
                              <TouchableOpacity
                                onPress={() => handleAnswerChange(key, "yes")}
                                style={[
                                  styles.answerButton,
                                  styles.answerYes,
                                  answers[key] === "yes" && styles.answerYesSelected,
                                  isReader && styles.answerDisabled,
                                ]}
                                activeOpacity={0.8}
                                disabled={isReader}
                              >
                                <Text
                                  style={[
                                    styles.answerLabel,
                                    answers[key] === "yes" && styles.answerLabelSelected,
                                  ]}
                                >
                                  Sim
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleAnswerChange(key, "no")}
                                style={[
                                  styles.answerButton,
                                  styles.answerNo,
                                  answers[key] === "no" && styles.answerNoSelected,
                                  isReader && styles.answerDisabled,
                                ]}
                                activeOpacity={0.8}
                                disabled={isReader}
                              >
                                <Text
                                  style={[
                                    styles.answerLabel,
                                    answers[key] === "no" && styles.answerLabelSelected,
                                  ]}
                                >
                                  Não
                                </Text>
                              </TouchableOpacity>
                              {answers[key] === "no" && (
                                <TouchableOpacity
                                  style={styles.commentIconBtn}
                                  onPress={() => openCommentModal(key)}
                                >
                                  <Text style={styles.commentIcon}>💬</Text>
                                  {comments[key] ? (
                                    <View style={styles.commentBadge}>
                                      <Text style={styles.commentBadgeText}>1</Text>
                                    </View>
                                  ) : null}
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

          {!isReader && (
            <View style={styles.addInstrumentWrapper}>
              <TouchableOpacity
                style={styles.addInstrumentButton}
                activeOpacity={0.85}
                onPress={handleAddTopic}
              >
                <Text style={styles.addInstrumentIcon}>＋</Text>
                <Text style={styles.addInstrumentText}>
                  Adicionar instrumento ou equipamento
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(selectedEquipments.length > 0 || instrumentInstances.length > 0) && FINAL_SECTION && (
            <View
              style={styles.finalSectionWrapper}
              onLayout={(e) => onSectionLayout("finalChecks", e)}
            >
              <View style={[styles.card, styles.cardFullWidth]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{FINAL_SECTION.title}</Text>
                </View>
                {FINAL_SECTION.items[0].questions.map((q) => {
                  const key = buildQuestionKey("finalChecks", q.id);
                  const isLeakQuestion = q.id === "final_leak";
                  return (
                    <View
                      key={q.id}
                      style={[
                        styles.questionBlock,
                        highlightedQuestionKey === key && styles.questionHighlight,
                      ]}
                    >
                      <Text style={styles.questionText}>{q.text}</Text>
                      <View style={styles.answerRow}>
                        {isLeakQuestion ? (
                          <>
                            {/* NÃO primeiro (sem vazamento, verde) */}
                            <TouchableOpacity
                              onPress={() => handleAnswerChange(key, "no")}
                              style={[
                                styles.answerButton,
                                styles.answerYes,
                                answers[key] === "no" && styles.answerYesSelected,
                                isReader && styles.answerDisabled,
                              ]}
                              activeOpacity={0.8}
                              disabled={isReader}
                            >
                              <Text
                                style={[
                                  styles.answerLabel,
                                  answers[key] === "no" && styles.answerLabelSelected,
                                ]}
                              >
                                Não
                              </Text>
                            </TouchableOpacity>
                            {/* SIM depois (houve vazamento, vermelho) */}
                            <TouchableOpacity
                              onPress={() => handleAnswerChange(key, "yes")}
                              style={[
                                styles.answerButton,
                                styles.answerNo,
                                answers[key] === "yes" && styles.answerNoSelected,
                                isReader && styles.answerDisabled,
                              ]}
                              activeOpacity={0.8}
                              disabled={isReader}
                            >
                              <Text
                                style={[
                                  styles.answerLabel,
                                  answers[key] === "yes" && styles.answerLabelSelected,
                                ]}
                              >
                                Sim
                              </Text>
                            </TouchableOpacity>
                            {answers[key] === "yes" && (
                              <TouchableOpacity
                                style={styles.commentIconBtn}
                                onPress={() => openCommentModal(key)}
                              >
                                <Text style={styles.commentIcon}>💬</Text>
                                {comments[key] ? (
                                  <View style={styles.commentBadge}>
                                    <Text style={styles.commentBadgeText}>1</Text>
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              onPress={() => handleAnswerChange(key, "yes")}
                              style={[
                                styles.answerButton,
                                styles.answerYes,
                                answers[key] === "yes" && styles.answerYesSelected,
                                isReader && styles.answerDisabled,
                              ]}
                              activeOpacity={0.8}
                              disabled={isReader}
                            >
                              <Text
                                style={[
                                  styles.answerLabel,
                                  answers[key] === "yes" && styles.answerLabelSelected,
                                ]}
                              >
                                Sim
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleAnswerChange(key, "no")}
                              style={[
                                styles.answerButton,
                                styles.answerNo,
                                answers[key] === "no" && styles.answerNoSelected,
                                isReader && styles.answerDisabled,
                              ]}
                              activeOpacity={0.8}
                              disabled={isReader}
                            >
                              <Text
                                style={[
                                  styles.answerLabel,
                                  answers[key] === "no" && styles.answerLabelSelected,
                                ]}
                              >
                                Não
                              </Text>
                            </TouchableOpacity>
                            {answers[key] === "no" && (
                              <TouchableOpacity
                                style={styles.commentIconBtn}
                                onPress={() => openCommentModal(key)}
                              >
                                <Text style={styles.commentIcon}>💬</Text>
                                {comments[key] ? (
                                  <View style={styles.commentBadge}>
                                    <Text style={styles.commentBadgeText}>1</Text>
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {isReader && (
            <View style={styles.readerBanner}>
              <Feather name="eye" size={15} color="#1e40af" />
              <Text style={styles.readerBannerText}>Modo leitura — sem permissão para editar</Text>
            </View>
          )}

          {!isReader && (selectedEquipments.length > 0 || instrumentInstances.length > 0) && (
            <View style={styles.saveWrapper}>
              <View style={styles.saveButtonsRow}>
                {allQuestionsAnswered && !hasAnyNoAnswer && (
                  <TouchableOpacity
                    style={[styles.saveButton, styles.forwardButton]}
                    activeOpacity={0.9}
                    onPress={handleCompleteRoute}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#fff"
                      style={styles.saveButtonIcon}
                    />
                    <Text style={styles.saveButtonText}>Concluir rota</Text>
                  </TouchableOpacity>
                )}
                {!allQuestionsAnswered && (
                  <View style={styles.pendingWarning}>
                    <Ionicons name="alert-circle" size={18} color="#b45309" />
                    <Text style={styles.pendingWarningText}>
                      Responda todos os itens (Sim ou Não) para concluir a rota.
                    </Text>
                  </View>
                )}
                {allQuestionsAnswered && hasAnyNoAnswer && (
                  <View style={styles.pendingWarning}>
                    <Ionicons name="alert-circle" size={18} color="#b45309" />
                    <Text style={styles.pendingWarningText}>
                      Existem itens com "Não". Resolva todos para concluir a rota.
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.saveButton, styles.saveOnlyButton]}
                  activeOpacity={0.9}
                  onPress={handleSaveDraft}
                >
                  <Ionicons
                    name="save"
                    size={20}
                    color="#fff"
                    style={styles.saveButtonIcon}
                  />
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={commentModalQuestionId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeCommentModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeCommentModal}>
          <KeyboardAvoidingView
            style={styles.commentModalContent}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
              <View style={styles.commentModalInner}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.commentModalScrollContent}
                >
                  <Text style={styles.modalTitle}>Detalhes do tópico</Text>
                  {isReader && (
                    <View style={styles.readerBanner}>
                      <Feather name="eye" size={13} color="#1e40af" />
                      <Text style={styles.readerBannerText}>Modo leitura — sem permissão para editar</Text>
                    </View>
                  )}
                  <Text style={styles.forwardLabel}>Anexo</Text>
                  <View style={[styles.attachmentVisualBox, isReader && styles.answerDisabled]}>
                    <Text style={styles.attachmentVisualText}>
                      Descreva o problema, ou adicione detalhes sobre o anexo...
                    </Text>
                    <TouchableOpacity
                      style={styles.attachmentIconButton}
                      activeOpacity={1}
                      disabled
                    >
                      <Feather name="image" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.forwardLabel}>Comentário</Text>
                  <TextInput
                    style={[styles.commentInput, isReader && styles.answerDisabled]}
                    placeholder="Descreva o problema..."
                    placeholderTextColor="#9CA3AF"
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    multiline
                    numberOfLines={3}
                    editable={!isReader}
                  />
                  <Text style={styles.forwardLabel}>Responsável</Text>
                  <TextInput
                    style={[styles.forwardInput, isReader && styles.answerDisabled]}
                    placeholder="Informe o responsável deste tópico"
                    placeholderTextColor="#9CA3AF"
                    value={commentResponsibleDraft}
                    onChangeText={setCommentResponsibleDraft}
                    editable={!isReader}
                  />
                  <Text style={styles.forwardLabel}>Prioridade</Text>
                <View style={styles.priorityDropdownWrapper}>
                  <TouchableOpacity
                    style={[styles.priorityDropdown, isReader && styles.answerDisabled]}
                    onPress={() => !isReader && setCommentPriorityDropdownOpen((prev) => !prev)}
                    activeOpacity={isReader ? 1 : 0.8}
                    disabled={isReader}
                  >
                    <Text
                      style={[
                        styles.priorityDropdownText,
                        !commentPriorityDraft && styles.priorityDropdownPlaceholder,
                      ]}
                    >
                      {commentPriorityDraft
                        ? commentPriorityDraft === "P1"
                          ? "(P1) High"
                          : commentPriorityDraft === "P2"
                          ? "(P2) Medium"
                          : "(P3) Improvements"
                        : "Selecione a prioridade"}
                    </Text>
                    <Text style={styles.priorityDropdownChevron}>
                      {commentPriorityDropdownOpen ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>
                  {commentPriorityDropdownOpen && (
                    <View style={styles.priorityDropdownList}>
                      {(["P1", "P2", "P3"] as const).map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={styles.priorityDropdownItem}
                          onPress={() => {
                            setCommentPriorityDraft(p);
                            setCommentPriorityDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.priorityDropdownItemText}>
                            {p === "P1" && "(P1) High"}
                            {p === "P2" && "(P2) Medium"}
                            {p === "P3" && "(P3) Improvements"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                  <Text style={styles.forwardLabel}>Data limite</Text>
                  <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavBtn} disabled={isReader}>
                      <Text style={[styles.calendarNavText, isReader && styles.answerDisabled]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.calendarHeaderTitle}>
                      {commentCalendarMonth.toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavBtn} disabled={isReader}>
                      <Text style={[styles.calendarNavText, isReader && styles.answerDisabled]}>›</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.calendarWeekRow}>
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((d, idx) => (
                      <Text key={`${d}-${idx}`} style={styles.calendarWeekDay}>
                        {d}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.calendarGrid}>
                    {(() => {
                      const year = commentCalendarMonth.getFullYear();
                      const month = commentCalendarMonth.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const cells: (number | null)[] = [
                        ...Array(firstDay).fill(null),
                        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                      ];
                      while (cells.length % 7 !== 0) {
                        cells.push(null);
                      }
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      return cells.map((day, idx) => {
                        const cellKey = `d-${idx}`;
                        if (!day) {
                          return <View key={cellKey} style={styles.calendarDayCell} />;
                        }
                        const cellDate = new Date(year, month, day);
                        cellDate.setHours(0, 0, 0, 0);
                        const isPast = cellDate < today;
                        const isSelected =
                          commentSelectedDate &&
                          cellDate.getTime() ===
                            new Date(
                              commentSelectedDate.getFullYear(),
                              commentSelectedDate.getMonth(),
                              commentSelectedDate.getDate()
                            ).getTime();
                        return (
                          <TouchableOpacity
                            key={cellKey}
                            style={[
                              styles.calendarDayCell,
                              isSelected && styles.calendarDaySelected,
                              isPast && styles.calendarDayDisabled,
                            ]}
                            disabled={isPast || isReader}
                            onPress={() => handleSelectDate(day)}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isSelected && styles.calendarDayTextSelected,
                                isPast && styles.calendarDayTextDisabled,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>
                    {commentSelectedDate && (
                      <Text style={styles.selectedDateText}>
                        Selecionado:{" "}
                        {commentSelectedDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                    )}
                  </View>
                </ScrollView>
                <View style={styles.modalActions}>
                  {isReader ? (
                    <TouchableOpacity style={styles.modalSave} onPress={closeCommentModal}>
                      <Text style={styles.modalSaveText}>Fechar</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.modalCancel} onPress={closeCommentModal}>
                        <Text style={styles.modalCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalSave} onPress={saveComment}>
                        <Text style={styles.modalSaveText}>Salvar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      <Modal
        visible={topicModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTopicModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTopicModalOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Adicionar instrumento/equipamento</Text>

            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  addMode === "equipment" && styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  setAddMode("equipment");
                  setSelectedEquipmentGroup(null);
                  setEquipmentSearch("");
                }}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    addMode === "equipment" && styles.modeToggleTextActive,
                  ]}
                >
                  Equipamentos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  addMode === "instrument" && styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  setAddMode("instrument");
                  setSelectedInstrumentGroup(null);
                  setInstrumentSearch("");
                }}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    addMode === "instrument" && styles.modeToggleTextActive,
                  ]}
                >
                  Instrumentos
                </Text>
              </TouchableOpacity>
            </View>

            {addMode === "equipment" ? (
              <>
                <Text style={styles.routeSubtitle}>Rota de alimentação</Text>
                <Text style={styles.modalSectionLabel}>Tipo de equipamento</Text>
                <View style={styles.groupList}>
                  {[
                    { id: "bombas" as const, label: "Bombas" },
                    { id: "tanques" as const, label: "Tanques" },
                    { id: "agitador" as const, label: "Agitador" },
                  ].map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupItem,
                        selectedEquipmentGroup === group.id && styles.groupItemSelected,
                      ]}
                      onPress={() => setSelectedEquipmentGroup(group.id)}
                    >
                      <Text
                        style={[
                          styles.groupItemText,
                          selectedEquipmentGroup === group.id &&
                            styles.groupItemTextSelected,
                        ]}
                      >
                        {group.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedEquipmentGroup && (
                  <>
                    <Text style={styles.modalSectionLabel}>Modelos disponíveis</Text>
                    <TextInput
                      style={styles.equipmentSearchInput}
                      placeholder="Buscar modelo (ex: P-2030B)"
                      placeholderTextColor="#9ca3af"
                      value={equipmentSearch}
                      onChangeText={setEquipmentSearch}
                    />
                    <View style={styles.routeDropdown}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {EQUIPMENTS.filter((eq) => {
                          if (selectedEquipmentGroup === "bombas" && !eq.startsWith("P-")) {
                            return false;
                          }
                          if (selectedEquipmentGroup === "tanques" && !eq.startsWith("T-")) {
                            return false;
                          }
                          if (selectedEquipmentGroup === "agitador" && !eq.startsWith("A-")) {
                            return false;
                          }
                          const term = equipmentSearch.trim().toLowerCase();
                          if (!term) return true;
                          return eq.toLowerCase().includes(term);
                        }).map((eq, idx, arr) => (
                          <Pressable
                            key={eq}
                            style={[
                              styles.dropdownItem,
                              selectedEquipments.includes(eq) &&
                                styles.dropdownItemSelected,
                              idx === arr.length - 1 && styles.dropdownItemLast,
                            ]}
                            onPress={() => {
                              handleSelectEquipment(eq);
                              setTopicModalOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedEquipments.includes(eq) &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              {eq}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.modalSectionLabel}>Tipo de instrumento</Text>
                <View style={styles.groupList}>
                  {[
                    { id: "chaves" as const, label: "Chaves de nível" },
                    { id: "pressao" as const, label: "Medidores de pressão" },
                    { id: "solenoides" as const, label: "Solenóides" },
                  ].map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupItem,
                        selectedInstrumentGroup === group.id && styles.groupItemSelected,
                      ]}
                      onPress={() => setSelectedInstrumentGroup(group.id)}
                    >
                      <Text
                        style={[
                          styles.groupItemText,
                          selectedInstrumentGroup === group.id &&
                            styles.groupItemTextSelected,
                        ]}
                      >
                        {group.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedInstrumentGroup && (
                  <>
                    <Text style={styles.modalSectionLabel}>Modelos disponíveis</Text>
                    <TextInput
                      style={styles.equipmentSearchInput}
                      placeholder="Buscar modelo (ex: LSH-2030)"
                      placeholderTextColor="#9ca3af"
                      value={instrumentSearch}
                      onChangeText={setInstrumentSearch}
                    />
                    <View style={styles.routeDropdown}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {(
                          selectedInstrumentGroup === "chaves"
                            ? LSH_CODES
                            : selectedInstrumentGroup === "pressao"
                            ? PIT_CODES
                            : [...XV_CODES, ...XZV_CODES, ...HV_CODES]
                        )
                          .filter((code) => {
                            const term = instrumentSearch.trim().toLowerCase();
                            if (!term) return true;
                            return code.toLowerCase().includes(term);
                          })
                          .map((code, idx, arr) => (
                            <Pressable
                              key={code}
                              style={[
                                styles.dropdownItem,
                                idx === arr.length - 1 && styles.dropdownItemLast,
                              ]}
                              onPress={() =>
                                addInstrumentByCode(selectedInstrumentGroup, code)
                              }
                            >
                              <Text style={styles.dropdownItemText}>{code}</Text>
                            </Pressable>
                          ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setTopicModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarIcon: {
    fontSize: 22,
    color: "#14532d",
  },
  topBarIconPlaceholder: {
    width: 28,
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#14532d",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  infoCard: {
    backgroundColor: "#ecfdf3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  infoText: {
    fontSize: 13,
    color: "#14532d",
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: "600",
  },
  routeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  routeDropdown: {
    marginTop: 4,
    marginLeft: 4,
    marginRight: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7e1d3",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  selectedEquipmentTagWrapper: {
    marginTop: 10,
    marginLeft: 4,
  },
  selectedEquipmentChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  equipmentQuestionsWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  equipmentChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  equipmentChipText: {
    fontSize: 11,
    color: "#166534",
  },
  sectionBlock: {
    marginBottom: 16,
    marginLeft: 0,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
    paddingRight: 8,
  },
  chevron: {
    fontSize: 12,
    color: "#14532d",
  },
  topicHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 8,
  },
  topicStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  topicStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topicStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dropdownList: {
    marginLeft: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7e1d3",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ecfdf3",
  },
  dropdownItemSelected: {
    backgroundColor: "#ecfdf3",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
  },
  dropdownItemTextSelected: {
    color: "#166534",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14532d",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginLeft: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFullWidth: {
    marginLeft: 0,
    marginRight: 0,
    width: "100%",
  },
  finalSectionWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  cardTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  cardTagText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "500",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteIconButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  questionBlock: {
    marginTop: 6,
  },
  questionHighlight: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  questionText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  answerRow: {
    flexDirection: "row",
    gap: 8,
  } as any,
  answerButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  answerYes: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  answerNo: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  answerYesSelected: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
  },
  answerNoSelected: {
    backgroundColor: "#dc2626",
    borderColor: "#b91c1c",
  },
  answerNeutral: {
    borderColor: "#bbf7d0",
    backgroundColor: "#ecfdf3",
  },
  answerNeutralSelected: {
    backgroundColor: "#86efac",
    borderColor: "#22c55e",
  },
  answerDisabled: {
    opacity: 0.45,
  },
  readerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  readerBannerText: {
    fontSize: 13,
    color: "#1e40af",
    fontWeight: "500",
  },
  commentInputIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentInputIconButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attachmentsPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e5e7eb",
  },
  attachmentChipMain: {
    flexShrink: 1,
    paddingRight: 4,
  },
  attachmentChipText: {
    fontSize: 11,
    color: "#374151",
  },
  attachmentChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  attachmentChipRemoveText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "700",
    lineHeight: 11,
  },
  imagePreviewContent: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    padding: 8,
  },
  imagePreview: {
    width: "100%",
    height: 360,
    backgroundColor: "#000000",
  },
  imagePreviewClose: {
    marginTop: 8,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  imagePreviewCloseText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  answerLabelSelected: {
    color: "#ffffff",
  },
  commentIconBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    alignItems: "center",
    justifyContent: "center",
  },
  commentIcon: {
    fontSize: 18,
  },
  commentBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  commentBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  commentModalContent: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flex: 1,
  },
  commentModalInner: {
    flex: 1,
    justifyContent: "space-between",
  },
  commentModalScrollContent: {
    paddingBottom: 12,
  },
  modeToggleContainer: {
    flexDirection: "row",
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    padding: 2,
    marginBottom: 12,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 999,
  },
  modeToggleButtonActive: {
    backgroundColor: "#14532d",
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  modeToggleTextActive: {
    color: "#ffffff",
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  groupList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  groupItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c7e1d3",
    backgroundColor: "#f9fafb",
  },
  groupItemSelected: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
  },
  groupItemText: {
    fontSize: 13,
    color: "#374151",
  },
  groupItemTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#c7e1d3",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  attachmentVisualBox: {
    borderWidth: 1,
    borderColor: "#c7e1d3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  attachmentVisualText: {
    flex: 1,
    fontSize: 13,
    color: "#9CA3AF",
  },
  attachmentIconButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  commentInputText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
    paddingRight: 8,
  },
  equipmentSearchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingBottom: 8,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalSave: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#16a34a",
    borderRadius: 999,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  forwardModalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  forwardLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginTop: 4,
    marginBottom: 4,
  },
  forwardInput: {
    borderWidth: 1,
    borderColor: "#c7e1d3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
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
    fontSize: 16,
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
  calendarDayDisabled: {
    opacity: 0.35,
  },
  calendarDayTextDisabled: {
    color: "#9ca3af",
  },
  selectedDateText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4b5563",
  },
  priorityDropdownWrapper: {
    marginBottom: 12,
  },
  priorityDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#c7e1d3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
  },
  priorityDropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  priorityDropdownPlaceholder: {
    color: "#9ca3af",
  },
  priorityDropdownChevron: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
  },
  priorityDropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#c7e1d3",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  priorityDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  priorityDropdownItemText: {
    fontSize: 14,
    color: "#111827",
  },
  modalSaveDisabled: {
    backgroundColor: "#9ca3af",
  },
  addInstrumentWrapper: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  addInstrumentButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#16a34a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#ecfdf3",
    justifyContent: "center",
  },
  addInstrumentIcon: {
    fontSize: 18,
    color: "#16a34a",
    marginRight: 6,
  },
  addInstrumentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
  },
  saveWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  saveButtonsRow: {
    flexDirection: "column",
    width: "100%",
    maxWidth: 420,
    gap: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignSelf: "stretch",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  saveOnlyButton: {
    backgroundColor: "#1d4ed8",
    opacity: 0.95,
    width: "92%",
    alignSelf: "center",
  },
  pendingWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  pendingWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
  },
  forwardButton: {
    backgroundColor: "#0d9488",
    width: "100%",
  },
  saveButtonIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

