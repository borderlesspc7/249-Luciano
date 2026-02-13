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
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  Component,
  CreateComponentData,
  UpdateComponentData,
} from "../types/components";

const COMPONENTS_COLLECTION = "components";
const PROJECTS_COLLECTION = "projects";
const MACHINES_COLLECTION = "machines";

export class ComponentService {
  static async createComponent(
    data: CreateComponentData,
    userId: string
  ): Promise<Component> {
    const now = new Date();
    const componentData: any = {
      name: data.name,
      type: data.type,
      status: "pending" as const,
      projectId: data.projectId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
      updatedBy: userId,
    };

    if (data.description) {
      componentData.description = data.description;
    }
    if (data.serialNumber) {
      componentData.serialNumber = data.serialNumber;
    }
    if (data.manufacturer) {
      componentData.manufacturer = data.manufacturer;
    }
    if (data.model) {
      componentData.model = data.model;
    }
    if (data.machineId) {
      componentData.machineId = data.machineId;
    }
    if (data.installationDate) {
      componentData.installationDate = Timestamp.fromDate(data.installationDate);
    }

    // Buscar nome do projeto
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, data.projectId));
    if (projectDoc.exists()) {
      componentData.projectName = projectDoc.data().name;
    }

    // Buscar nome da máquina se fornecido
    if (data.machineId) {
      const machineDoc = await getDoc(doc(db, MACHINES_COLLECTION, data.machineId));
      if (machineDoc.exists()) {
        componentData.machineName = machineDoc.data().name;
      }
    }

    const docRef = await addDoc(
      collection(db, COMPONENTS_COLLECTION),
      componentData
    );

    return {
      id: docRef.id,
      ...componentData,
      installationDate: data.installationDate,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async getComponents(): Promise<Component[]> {
    const q = query(
      collection(db, COMPONENTS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const components: Component[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      components.push({
        id: docSnapshot.id,
        name: data.name || "",
        description: data.description,
        type: data.type || "",
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        projectId: data.projectId || "",
        projectName: data.projectName,
        machineId: data.machineId,
        machineName: data.machineName,
        status: data.status || "pending",
        installationDate: data.installationDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
      });
    });

    return components;
  }

  static async getComponent(componentId: string): Promise<Component | null> {
    const docSnap = await getDoc(doc(db, COMPONENTS_COLLECTION, componentId));

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || "",
      description: data.description,
      type: data.type || "",
      serialNumber: data.serialNumber,
      manufacturer: data.manufacturer,
      model: data.model,
      projectId: data.projectId || "",
      projectName: data.projectName,
      machineId: data.machineId,
      machineName: data.machineName,
      status: data.status || "pending",
      installationDate: data.installationDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || "",
      updatedBy: data.updatedBy || "",
    };
  }

  static async updateComponent(
    componentId: string,
    data: UpdateComponentData,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, COMPONENTS_COLLECTION, componentId);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.serialNumber !== undefined) {
      updateData.serialNumber = data.serialNumber;
    }
    if (data.manufacturer !== undefined) {
      updateData.manufacturer = data.manufacturer;
    }
    if (data.model !== undefined) {
      updateData.model = data.model;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.projectId !== undefined) {
      updateData.projectId = data.projectId;
      // Buscar nome do projeto
      const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, data.projectId));
      if (projectDoc.exists()) {
        updateData.projectName = projectDoc.data().name;
      }
    }
    if (data.machineId !== undefined) {
      updateData.machineId = data.machineId;
      if (data.machineId) {
        const machineDoc = await getDoc(doc(db, MACHINES_COLLECTION, data.machineId));
        if (machineDoc.exists()) {
          updateData.machineName = machineDoc.data().name;
        }
      } else {
        updateData.machineName = null;
      }
    }
    if (data.installationDate !== undefined) {
      updateData.installationDate = Timestamp.fromDate(data.installationDate);
    }

    await updateDoc(docRef, updateData);
  }

  static async deleteComponent(componentId: string): Promise<void> {
    await deleteDoc(doc(db, COMPONENTS_COLLECTION, componentId));
  }

  static async getComponentsByProject(projectId: string): Promise<Component[]> {
    const q = query(
      collection(db, COMPONENTS_COLLECTION),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const components: Component[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      components.push({
        id: docSnapshot.id,
        name: data.name || "",
        description: data.description,
        type: data.type || "",
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        projectId: data.projectId || "",
        projectName: data.projectName,
        machineId: data.machineId,
        machineName: data.machineName,
        status: data.status || "pending",
        installationDate: data.installationDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
      });
    });

    return components;
  }

  static async getComponentsByMachine(machineId: string): Promise<Component[]> {
    const q = query(
      collection(db, COMPONENTS_COLLECTION),
      where("machineId", "==", machineId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const components: Component[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      components.push({
        id: docSnapshot.id,
        name: data.name || "",
        description: data.description,
        type: data.type || "",
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        projectId: data.projectId || "",
        projectName: data.projectName,
        machineId: data.machineId,
        machineName: data.machineName,
        status: data.status || "pending",
        installationDate: data.installationDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
      });
    });

    return components;
  }
}
