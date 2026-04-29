import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./AuthContext";
import { checklistDraftService } from "../services/checklistDraftService";

export type InstrumentInstance = {
  instanceId: string;
  sectionId: string;
  itemId: string;
};

export type ChecklistDraft = {
  id: string;
  userId: string;
  projectName?: string;
  routeName?: string;
  folderName?: string;
  startDate?: string;
  endDate?: string;
  equipmentIds: string[];
  instrumentInstances: InstrumentInstance[];
  answers: Record<string, "yes" | "no">;
  comments: Record<string, string>;
  // mantidos por compatibilidade com dados antigos
  activeTopicsIds: string[];
  selectedBySection: Record<string, string | null>;
  questionResponsibles?: Record<string, string>;
  questionPriorities?: Record<string, "P1" | "P2" | "P3">;
  questionDeadlines?: Record<string, string>;
  questionLabels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type ChecklistDraftsContextType = {
  items: ChecklistDraft[];
  saveDraft: (input: {
    id?: string;
    projectName?: string;
    routeName?: string;
    folderName?: string;
    startDate?: string;
    endDate?: string;
    equipmentIds: string[];
    instrumentInstances: InstrumentInstance[];
    answers: Record<string, "yes" | "no">;
    comments: Record<string, string>;
    activeTopicsIds: string[];
    selectedBySection: Record<string, string | null>;
    questionResponsibles?: Record<string, string>;
    questionPriorities?: Record<string, "P1" | "P2" | "P3">;
    questionDeadlines?: Record<string, string>;
    questionLabels?: Record<string, string>;
  }) => Promise<ChecklistDraft | null>;
  deleteDraft: (id: string) => Promise<void>;
  deleteDraftsByFolder: (folderName: string, projectName?: string) => Promise<void>;
};

const ChecklistDraftsContext = createContext<ChecklistDraftsContextType | null>(null);

export function ChecklistDraftsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ChecklistDraft[]>([]);
  const auth = useContext(AuthContext);
  const loadingRef = useRef(false);

  useEffect(() => {
    const user = auth?.user;

    if (!user) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        loadingRef.current = true;
        const data = await checklistDraftService.listAll();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error("Erro ao carregar checklists salvos:", error);
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth?.user?.uid]);

  const saveDraft = useCallback<ChecklistDraftsContextType["saveDraft"]>(
    async (input) => {
      const user = auth?.user;
      if (!user) return null;
      if (user.role === "reader") return null;

      const existingDraft = input.id ? items.find((draft) => draft.id === input.id) : undefined;

      // Atualiza quando o draft existe localmente; caso contrário, cria um novo.
      if (input.id && existingDraft) {
        await checklistDraftService.update(input.id, {
          projectName: input.projectName,
          routeName: input.routeName,
          folderName: input.folderName,
          startDate: input.startDate,
          endDate: input.endDate,
          equipmentIds: input.equipmentIds,
          instrumentInstances: input.instrumentInstances,
          answers: input.answers,
          comments: input.comments,
          activeTopicsIds: input.activeTopicsIds,
          selectedBySection: input.selectedBySection,
          questionResponsibles: input.questionResponsibles,
          questionPriorities: input.questionPriorities,
          questionDeadlines: input.questionDeadlines,
          questionLabels: input.questionLabels,
        });

        setItems((prev) =>
          prev.map((draft) =>
            draft.id === input.id
              ? {
                  ...draft,
                  projectName: input.projectName,
                  routeName: input.routeName,
                  folderName: input.folderName,
                  startDate: input.startDate,
                  endDate: input.endDate,
                  equipmentIds: input.equipmentIds,
                  instrumentInstances: input.instrumentInstances,
                  answers: input.answers,
                  comments: input.comments,
                  activeTopicsIds: input.activeTopicsIds,
                  selectedBySection: input.selectedBySection,
                  questionResponsibles: input.questionResponsibles,
                  questionPriorities: input.questionPriorities,
                  questionDeadlines: input.questionDeadlines,
                  questionLabels: input.questionLabels,
                  updatedAt: new Date().toISOString(),
                }
              : draft
          )
        );

        const updated = items.find((d) => d.id === input.id);
        return (
          updated ?? {
            id: input.id,
            userId: user.uid,
            projectName: input.projectName,
            routeName: input.routeName,
            folderName: input.folderName,
            startDate: input.startDate,
            endDate: input.endDate,
            equipmentIds: input.equipmentIds,
            instrumentInstances: input.instrumentInstances,
            answers: input.answers,
            comments: input.comments,
            activeTopicsIds: input.activeTopicsIds,
            selectedBySection: input.selectedBySection,
            questionResponsibles: input.questionResponsibles ?? {},
            questionPriorities: input.questionPriorities ?? {},
            questionDeadlines: input.questionDeadlines ?? {},
            questionLabels: input.questionLabels ?? {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      }

      const created = await checklistDraftService.create(user.uid, {
        projectName: input.projectName,
        routeName: input.routeName,
        folderName: input.folderName,
        startDate: input.startDate,
        endDate: input.endDate,
        equipmentIds: input.equipmentIds,
        instrumentInstances: input.instrumentInstances,
        answers: input.answers,
        comments: input.comments,
        activeTopicsIds: input.activeTopicsIds,
        selectedBySection: input.selectedBySection,
        questionResponsibles: input.questionResponsibles,
        questionPriorities: input.questionPriorities,
        questionDeadlines: input.questionDeadlines,
        questionLabels: input.questionLabels,
      });

      setItems((prev) => [created, ...prev]);
      return created;
    },
    [auth?.user, items]
  );

  const deleteDraft = useCallback<ChecklistDraftsContextType["deleteDraft"]>(async (id) => {
    const user = auth?.user;
    if (!user || user.role === "reader") return;
    await checklistDraftService.delete(id);
    setItems((prev) => prev.filter((draft) => draft.id !== id));
  }, [auth?.user]);

  const deleteDraftsByFolder = useCallback<ChecklistDraftsContextType["deleteDraftsByFolder"]>(
    async (folderName, projectName) => {
      const user = auth?.user;
      if (!user || user.role === "reader") return;
      const toDelete = items.filter((draft) => {
        const draftFolder = draft.folderName ?? "Sem pasta";
        if (draftFolder !== folderName) return false;
        if (!projectName) return true;
        const draftProject =
          draft.projectName && draft.projectName.trim() ? draft.projectName.trim() : "FW+";
        return draftProject === projectName;
      });

      await Promise.all(toDelete.map((draft) => checklistDraftService.delete(draft.id)));

      setItems((prev) =>
        prev.filter((draft) => {
          const draftFolder = draft.folderName ?? "Sem pasta";
          if (draftFolder !== folderName) return true;
          if (!projectName) return false;
          const draftProject =
            draft.projectName && draft.projectName.trim() ? draft.projectName.trim() : "FW+";
          return draftProject !== projectName;
        })
      );
    },
    [items, auth?.user]
  );

  return (
    <ChecklistDraftsContext.Provider value={{ items, saveDraft, deleteDraft, deleteDraftsByFolder }}>
      {children}
    </ChecklistDraftsContext.Provider>
  );
}

export function useChecklistDrafts() {
  const ctx = useContext(ChecklistDraftsContext);
  if (!ctx) {
    throw new Error("useChecklistDrafts must be used within a ChecklistDraftsProvider");
  }
  return ctx;
}

