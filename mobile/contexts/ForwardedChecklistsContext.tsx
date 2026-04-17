import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { AuthContext } from "./AuthContext";
import { forwardedChecklistService } from "../services/forwardedChecklistService";

export type InstrumentInstance = {
  instanceId: string;
  sectionId: string;
  itemId: string;
};

export type ForwardedChecklistItem = {
  id: string;
  userId: string;
  equipmentId: string;
  equipmentName: string;
  answers: Record<string, "yes" | "no">;
  comments: Record<string, string>;
  instrumentInstances?: InstrumentInstance[];
  activeTopicsIds: string[];
  selectedBySection: Record<string, string | null>;
  forwardedAt: string;
  status: "open" | "done";
  completedAt?: string | null;
  responsible?: string;
  deadline?: string;
  priority?: "P1" | "P2" | "P3";
  projectName?: string;
  routeName?: string;
  folderName?: string;
  startDate?: string;
  endDate?: string;
  kind?: "checklist" | "resolved_action";
  checklistRefId?: string;
  questionLabels?: Record<string, string>;
  questionResponsibles?: Record<string, string>;
  questionPriorities?: Record<string, "P1" | "P2" | "P3">;
  questionDeadlines?: Record<string, string>;
};

type ForwardedChecklistsContextType = {
  items: ForwardedChecklistItem[];
  addForwarded: (
    item: Omit<ForwardedChecklistItem, "id" | "forwardedAt" | "status" | "completedAt" | "userId">
  ) => Promise<void>;
  completeChecklist: (id: string) => Promise<void>;
  deleteByFolder: (folderName: string, projectName?: string) => Promise<void>;
};

const ForwardedChecklistsContext = createContext<ForwardedChecklistsContextType | null>(null);

export function ForwardedChecklistsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ForwardedChecklistItem[]>([]);
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
        const data = await forwardedChecklistService.listAll();
        if (!cancelled) {
          setItems(
            data.map((item) => ({
              ...item,
              projectName: item.projectName && item.projectName.trim() ? item.projectName : "FW+",
            }))
          );
        }
      } catch (error) {
        // Logamos o erro para facilitar depuração, mas não quebramos a UI
        console.error("Erro ao carregar forwarded checklists:", error);
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth?.user?.uid]);

  const addForwarded = useCallback<ForwardedChecklistsContextType["addForwarded"]>(
    async (item) => {
      const user = auth?.user;
      if (!user) {
        return;
      }

      const created = await forwardedChecklistService.create(user.uid, item);
      setItems((prev) => [created, ...prev]);
    },
    [auth?.user]
  );

  const completeChecklist = useCallback<ForwardedChecklistsContextType["completeChecklist"]>(
    async (id: string) => {
      await forwardedChecklistService.markDone(id);
      const completedAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "done", completedAt } : item
        )
      );
    },
    []
  );

  const deleteByFolder = useCallback<ForwardedChecklistsContextType["deleteByFolder"]>(
    async (folderName, projectName) => {
      const user = auth?.user;
      if (!user) return;

      const toDelete = items.filter((item) => {
        if (item.userId !== user.uid) return false;
        const itemFolder = item.folderName ?? "Sem pasta";
        if (itemFolder !== folderName) return false;
        if (!projectName) return true;
        const itemProject =
          item.projectName && item.projectName.trim() ? item.projectName.trim() : "FW+";
        return itemProject === projectName;
      });

      await Promise.all(toDelete.map((item) => forwardedChecklistService.delete(item.id)));

      setItems((prev) =>
        prev.filter((item) => {
          const itemFolder = item.folderName ?? "Sem pasta";
          if (itemFolder !== folderName) return true;
          if (!projectName) return false;
          const itemProject =
            item.projectName && item.projectName.trim() ? item.projectName.trim() : "FW+";
          return itemProject !== projectName;
        })
      );
    },
    [items, auth?.user]
  );

  return (
    <ForwardedChecklistsContext.Provider
      value={{ items, addForwarded, completeChecklist, deleteByFolder }}
    >
      {children}
    </ForwardedChecklistsContext.Provider>
  );
}

export function useForwardedChecklists() {
  const ctx = useContext(ForwardedChecklistsContext);
  if (!ctx) throw new Error("useForwardedChecklists must be used within ForwardedChecklistsProvider");
  return ctx;
}

export type { ForwardedChecklistItem };
