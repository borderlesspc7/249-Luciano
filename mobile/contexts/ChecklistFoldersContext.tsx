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
import { checklistFolderService } from "../services/checklistFolderService";

export type ChecklistFolder = {
  id: string;
  userId: string;
  projectName?: string;
  areaName?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ChecklistFoldersContextType = {
  items: ChecklistFolder[];
  createFolder: (input: { projectName?: string; areaName?: string; name: string }) => Promise<ChecklistFolder | null>;
  deleteFolder: (id: string) => Promise<void>;
};

const ChecklistFoldersContext = createContext<ChecklistFoldersContextType | null>(null);

export function ChecklistFoldersProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ChecklistFolder[]>([]);
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
        const data = await checklistFolderService.listAll();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error("Erro ao carregar pastas de checklists:", error);
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth?.user?.uid]);

  const createFolder = useCallback<ChecklistFoldersContextType["createFolder"]>(
    async (input) => {
      const user = auth?.user;
      if (!user) return null;
      if (user.role === "reader") return null;

      const created = await checklistFolderService.create(user.uid, {
        projectName: input.projectName,
        areaName: input.areaName,
        name: input.name,
      });

      setItems((prev) => [created, ...prev]);
      return created;
    },
    [auth?.user]
  );

  const deleteFolder = useCallback<ChecklistFoldersContextType["deleteFolder"]>(async (id) => {
    await checklistFolderService.delete(id);
    setItems((prev) => prev.filter((folder) => folder.id !== id));
  }, []);

  return (
    <ChecklistFoldersContext.Provider value={{ items, createFolder, deleteFolder }}>
      {children}
    </ChecklistFoldersContext.Provider>
  );
}

export function useChecklistFolders() {
  const ctx = useContext(ChecklistFoldersContext);
  if (!ctx) {
    throw new Error("useChecklistFolders must be used within a ChecklistFoldersProvider");
  }
  return ctx;
}

