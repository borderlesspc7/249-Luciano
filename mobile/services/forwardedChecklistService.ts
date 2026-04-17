import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { ForwardedChecklistItem } from "../contexts/ForwardedChecklistsContext";

const COLLECTION_NAME = "forwardedChecklists";

type ForwardedChecklistCreateInput = Omit<
  ForwardedChecklistItem,
  "id" | "forwardedAt" | "status" | "completedAt" | "userId"
>;

export const forwardedChecklistService = {
  async listAll(): Promise<ForwardedChecklistItem[]> {
    const q = query(collection(db, COLLECTION_NAME));

    const snap = await getDocs(q);

    const items = snap.docs.map((snapshot) => {
      const data = snapshot.data() as any;

      const rawSelectedBySection = data.selectedBySection ?? {};
      const normalizedSelectedBySection: Record<string, string | null> = {};
      Object.keys(rawSelectedBySection).forEach((key) => {
        const value: any = rawSelectedBySection[key];
        if (typeof value === "string") {
          normalizedSelectedBySection[key] = value;
        } else if (Array.isArray(value) && typeof value[0] === "string") {
          normalizedSelectedBySection[key] = value[0];
        } else {
          normalizedSelectedBySection[key] = null;
        }
      });

      let instrumentInstances: Array<{instanceId: string; sectionId: string; itemId: string}> =
        data.instrumentInstances ?? [];
      if (instrumentInstances.length === 0 && data.activeTopicsIds && data.selectedBySection) {
        (data.activeTopicsIds as string[]).forEach((sectionId: string) => {
          const itemId = data.selectedBySection[sectionId];
          if (typeof itemId === "string" && itemId.trim()) {
            instrumentInstances.push({
              instanceId: `${sectionId}:${itemId}:0`,
              sectionId,
              itemId,
            });
          }
        });
      }

      return {
        id: snapshot.id,
        userId: data.userId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        answers: data.answers ?? {},
        comments: data.comments ?? {},
        instrumentInstances,
        activeTopicsIds: data.activeTopicsIds ?? [],
        selectedBySection: normalizedSelectedBySection,
        forwardedAt: data.forwardedAt,
        status: data.status ?? "open",
        completedAt: data.completedAt,
        responsible: data.responsible,
        deadline: data.deadline,
        priority: data.priority,
        projectName: data.projectName,
        routeName: data.routeName,
        folderName: data.folderName,
        startDate: data.startDate,
        endDate: data.endDate,
        kind: data.kind,
        checklistRefId: data.checklistRefId,
        questionLabels: data.questionLabels ?? {},
        questionResponsibles: data.questionResponsibles ?? {},
        questionPriorities: data.questionPriorities ?? {},
        questionDeadlines: data.questionDeadlines ?? {},
      } as ForwardedChecklistItem;
    });

    // Ordena no cliente por data de encaminhamento (mais recentes primeiro)
    return items.sort((a, b) => {
      const aDate = a.forwardedAt ?? "";
      const bDate = b.forwardedAt ?? "";
      return bDate.localeCompare(aDate);
    });
  },

  async create(
    userId: string,
    item: ForwardedChecklistCreateInput
  ): Promise<ForwardedChecklistItem> {
    const nowIso = new Date().toISOString();

    const answers = item.answers ?? {};
    const entries = Object.entries(answers);

    // Considera o mesmo critério de conclusão usado na tela:
    // - Todas as questões devem estar "ok"
    // - Para a pergunta "Houve vazamento no sistema?" (finalChecks:final_leak),
    //   o valor "no" significa "sem vazamento" (ok)
    const hasNoIssues =
      entries.length > 0 &&
      entries.every(([key, value]) => {
        if (key === "finalChecks:final_leak") {
          return value === "no";
        }
        return value === "yes";
      });

    const rawPayload = {
      ...item,
      userId,
      forwardedAt: nowIso,
      status: (hasNoIssues ? "done" : "open") as const,
      completedAt: (hasNoIssues ? nowIso : null) as string | null,
    };

    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, value]) => value !== undefined)
    ) as Omit<ForwardedChecklistItem, "id">;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    return {
      ...payload,
      id: docRef.id,
    };
  },

  async markDone(id: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, id);
    const completedAt = new Date().toISOString();
    await updateDoc(ref, {
      status: "done",
      completedAt,
    });
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  },
};

