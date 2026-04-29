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
import { checklistAreaService } from "../services/checklistAreaService";

export type ChecklistArea = {
  id: string;
  userId: string;
  projectName?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ChecklistAreasContextType = {
  items: ChecklistArea[];
  createArea: (input: { projectName?: string; name: string }) => Promise<ChecklistArea | null>;
  deleteArea: (id: string) => Promise<void>;
};

const ChecklistAreasContext = createContext<ChecklistAreasContextType | null>(null);

export function ChecklistAreasProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ChecklistArea[]>([]);
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
        const data = await checklistAreaService.listAll();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error("Erro ao carregar areas de checklists:", error);
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth?.user?.uid]);

  const createArea = useCallback<ChecklistAreasContextType["createArea"]>(
    async (input) => {
      const user = auth?.user;
      if (!user) return null;
      if (user.role === "reader") return null;

      const created = await checklistAreaService.create(user.uid, {
        projectName: input.projectName,
        name: input.name,
      });

      setItems((prev) => [created, ...prev]);
      return created;
    },
    [auth?.user]
  );

  const deleteArea = useCallback<ChecklistAreasContextType["deleteArea"]>(async (id) => {
    await checklistAreaService.delete(id);
    setItems((prev) => prev.filter((area) => area.id !== id));
  }, []);

  return (
    <ChecklistAreasContext.Provider value={{ items, createArea, deleteArea }}>
      {children}
    </ChecklistAreasContext.Provider>
  );
}

export function useChecklistAreas() {
  const ctx = useContext(ChecklistAreasContext);
  if (!ctx) {
    throw new Error("useChecklistAreas must be used within a ChecklistAreasProvider");
  }
  return ctx;
}

