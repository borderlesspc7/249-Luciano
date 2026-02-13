import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  CommissioningStep,
  CreateCommissioningStepData,
  UpdateCommissioningStepData,
  Evidence,
  Approval,
} from "../types/commissioning";

const COMMISSIONING_STEPS_COLLECTION = "commissioning_steps";
const PROJECTS_COLLECTION = "projects";
const COMPONENTS_COLLECTION = "components";
const MACHINES_COLLECTION = "machines";
const USERS_COLLECTION = "users";

export class CommissioningService {
  static async createStep(
    data: CreateCommissioningStepData,
    userId: string
  ): Promise<CommissioningStep> {
    const now = new Date();
    const stepData: any = {
      name: data.name,
      type: data.type,
      status: "pending" as const,
      projectId: data.projectId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
      updatedBy: userId,
      evidence: [],
      approvals: [],
    };

    if (data.description) {
      stepData.description = data.description;
    }
    if (data.componentId) {
      stepData.componentId = data.componentId;
    }
    if (data.machineId) {
      stepData.machineId = data.machineId;
    }
    if (data.assignedTo) {
      stepData.assignedTo = data.assignedTo;
      // Buscar nome do usuário
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, data.assignedTo));
      if (userDoc.exists()) {
        stepData.assignedToName = userDoc.data().name;
      }
    }
    if (data.dueDate) {
      stepData.dueDate = Timestamp.fromDate(data.dueDate);
    }

    // Buscar nomes relacionados
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, data.projectId));
    if (projectDoc.exists()) {
      stepData.projectName = projectDoc.data().name;
    }

    if (data.componentId) {
      const componentDoc = await getDoc(
        doc(db, COMPONENTS_COLLECTION, data.componentId)
      );
      if (componentDoc.exists()) {
        stepData.componentName = componentDoc.data().name;
      }
    }

    if (data.machineId) {
      const machineDoc = await getDoc(doc(db, MACHINES_COLLECTION, data.machineId));
      if (machineDoc.exists()) {
        stepData.machineName = machineDoc.data().name;
      }
    }

    const docRef = await addDoc(
      collection(db, COMMISSIONING_STEPS_COLLECTION),
      stepData
    );

    return {
      id: docRef.id,
      ...stepData,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async getSteps(): Promise<CommissioningStep[]> {
    const q = query(
      collection(db, COMMISSIONING_STEPS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const steps: CommissioningStep[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      steps.push(this.mapStepData(docSnapshot.id, data));
    });

    return steps;
  }

  static async getStep(stepId: string): Promise<CommissioningStep | null> {
    const docSnap = await getDoc(doc(db, COMMISSIONING_STEPS_COLLECTION, stepId));

    if (!docSnap.exists()) {
      return null;
    }

    return this.mapStepData(docSnap.id, docSnap.data());
  }

  static async updateStep(
    stepId: string,
    data: UpdateCommissioningStepData,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, COMMISSIONING_STEPS_COLLECTION, stepId);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    };

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "in_progress" && !updateData.startedAt) {
        updateData.startedAt = Timestamp.fromDate(new Date());
      }
      if (data.status === "completed" || data.status === "failed") {
        updateData.completedAt = Timestamp.fromDate(new Date());
      }
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo;
      if (data.assignedTo) {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, data.assignedTo));
        if (userDoc.exists()) {
          updateData.assignedToName = userDoc.data().name;
        }
      } else {
        updateData.assignedToName = null;
      }
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? Timestamp.fromDate(data.dueDate) : null;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt
        ? Timestamp.fromDate(data.completedAt)
        : null;
    }

    await updateDoc(docRef, updateData);
  }

  static async deleteStep(stepId: string): Promise<void> {
    await deleteDoc(doc(db, COMMISSIONING_STEPS_COLLECTION, stepId));
  }

  static async getStepsByProject(projectId: string): Promise<CommissioningStep[]> {
    const q = query(
      collection(db, COMMISSIONING_STEPS_COLLECTION),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const steps: CommissioningStep[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      steps.push(this.mapStepData(docSnapshot.id, data));
    });

    return steps;
  }

  static async getStepsByStatus(
    status: "pending" | "in_progress" | "completed" | "failed" | "skipped"
  ): Promise<CommissioningStep[]> {
    const q = query(
      collection(db, COMMISSIONING_STEPS_COLLECTION),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const steps: CommissioningStep[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      steps.push(this.mapStepData(docSnapshot.id, data));
    });

    return steps;
  }

  static async addEvidence(
    stepId: string,
    evidence: Omit<Evidence, "id" | "uploadedAt">,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, COMMISSIONING_STEPS_COLLECTION, stepId);
    const evidenceData: Evidence = {
      id: `${Date.now()}-${Math.random()}`,
      ...evidence,
      uploadedAt: new Date(),
      uploadedBy: userId,
    };

    await updateDoc(docRef, {
      evidence: arrayUnion(evidenceData),
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    });
  }

  static async removeEvidence(stepId: string, evidenceId: string): Promise<void> {
    const step = await this.getStep(stepId);
    if (!step) return;

    const updatedEvidence = step.evidence?.filter((e) => e.id !== evidenceId) || [];
    const docRef = doc(db, COMMISSIONING_STEPS_COLLECTION, stepId);

    await updateDoc(docRef, {
      evidence: updatedEvidence,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  static async addApproval(
    stepId: string,
    approval: Omit<Approval, "id">,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, COMMISSIONING_STEPS_COLLECTION, stepId);
    const approvalData: Approval = {
      id: `${Date.now()}-${Math.random()}`,
      ...approval,
    };

    await updateDoc(docRef, {
      approvals: arrayUnion(approvalData),
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    });
  }

  private static mapStepData(id: string, data: any): CommissioningStep {
    return {
      id,
      name: data.name || "",
      description: data.description,
      type: data.type || "visual_inspection",
      status: data.status || "pending",
      projectId: data.projectId || "",
      projectName: data.projectName,
      componentId: data.componentId,
      componentName: data.componentName,
      machineId: data.machineId,
      machineName: data.machineName,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      dueDate: data.dueDate?.toDate(),
      notes: data.notes,
      evidence: (data.evidence || []).map((e: any) => ({
        ...e,
        uploadedAt: e.uploadedAt?.toDate() || new Date(),
      })),
      approvals: (data.approvals || []).map((a: any) => ({
        ...a,
        approvedAt: a.approvedAt?.toDate(),
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || "",
      updatedBy: data.updatedBy || "",
    };
  }
}
