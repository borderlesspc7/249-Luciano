import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { ChecklistDraft } from "../contexts/ChecklistDraftsContext";

const COLLECTION_NAME = "checklistDrafts";

type ChecklistDraftCreateInput = Omit<
  ChecklistDraft,
  "id" | "createdAt" | "updatedAt" | "userId"
>;

export const checklistDraftService = {
  async listAll(): Promise<ChecklistDraft[]> {
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

      // Migração: converte dados antigos (activeTopicsIds+selectedBySection) para instrumentInstances
      let instrumentInstances: Array<{instanceId: string; sectionId: string; itemId: string}> =
        data.instrumentInstances ?? [];
      if (instrumentInstances.length === 0 && data.activeTopicsIds && data.selectedBySection) {
        (data.activeTopicsIds as string[]).forEach((sectionId) => {
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
        projectName: data.projectName,
        routeName: data.routeName,
        folderName: data.folderName,
        startDate: data.startDate,
        endDate: data.endDate,
        equipmentIds: data.equipmentIds ?? [],
        instrumentInstances,
        answers: data.answers ?? {},
        comments: data.comments ?? {},
        activeTopicsIds: data.activeTopicsIds ?? [],
        selectedBySection: normalizedSelectedBySection,
        questionResponsibles: data.questionResponsibles ?? {},
        questionPriorities: data.questionPriorities ?? {},
        questionDeadlines: data.questionDeadlines ?? {},
        questionLabels: data.questionLabels ?? {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as ChecklistDraft;
    });

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async create(
    userId: string,
    item: ChecklistDraftCreateInput
  ): Promise<ChecklistDraft> {
    const nowIso = new Date().toISOString();

    const payload = {
      ...item,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    return {
      ...payload,
      id: docRef.id,
    };
  },

  async update(id: string, partial: Partial<ChecklistDraftCreateInput>): Promise<void> {
    const nowIso = new Date().toISOString();
    const ref = doc(db, COLLECTION_NAME, id);
    const sanitizedPartial = Object.fromEntries(
      Object.entries(partial).filter(([, value]) => value !== undefined)
    );
    await updateDoc(ref, {
      ...sanitizedPartial,
      updatedAt: nowIso,
    });
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  },
};

