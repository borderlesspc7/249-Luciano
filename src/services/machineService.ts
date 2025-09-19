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
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  Machine,
  CreateMachineData,
  UpdateMachineData,
  Cluster,
} from "../types/machines";

const MACHINES_COLLECTION = "machines";
const CLUSTERS_COLLECTION = "clusters";

export class MachineService {
  // Máquinas
  static async createMachine(
    data: CreateMachineData,
    userId: string
  ): Promise<Machine> {
    const now = new Date();
    const machineData: any = {
      name: data.name,
      type: data.type,
      status: "active" as const,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
      updatedBy: userId,
    };

    // Only add optional fields if they have values
    if (data.description) {
      machineData.description = data.description;
    }
    if (data.clusterId) {
      machineData.clusterId = data.clusterId;
    }

    const docRef = await addDoc(
      collection(db, MACHINES_COLLECTION),
      machineData
    );

    // Buscar cluster se clusterId foi fornecido
    let clusterName: string | undefined;
    if (data.clusterId) {
      const clusterDoc = await getDoc(
        doc(db, CLUSTERS_COLLECTION, data.clusterId)
      );
      if (clusterDoc.exists()) {
        clusterName = clusterDoc.data().name;
      }
    }

    return {
      id: docRef.id,
      ...machineData,
      createdAt: now,
      updatedAt: now,
      clusterName,
    };
  }

  static async getMachines(): Promise<Machine[]> {
    const q = query(
      collection(db, MACHINES_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const machines: Machine[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const machine: Machine = {
        id: docSnapshot.id,
        name: data.name,
        type: data.type,
        status: data.status,
        description: data.description,
        clusterId: data.clusterId,
        clusterName: data.clusterName,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      };
      machines.push(machine);
    }

    return machines;
  }

  static async getMachineById(id: string): Promise<Machine | null> {
    const docRef = doc(db, MACHINES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      type: data.type,
      status: data.status,
      description: data.description,
      clusterId: data.clusterId,
      clusterName: data.clusterName,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  static async updateMachine(
    id: string,
    data: UpdateMachineData,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, MACHINES_COLLECTION, id);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    };

    // Only add fields that have values
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.clusterId !== undefined) {
      updateData.clusterId = data.clusterId;
    }

    // Se clusterId foi atualizado, buscar o nome do cluster
    if (data.clusterId) {
      const clusterDoc = await getDoc(
        doc(db, CLUSTERS_COLLECTION, data.clusterId)
      );
      if (clusterDoc.exists()) {
        updateData.clusterName = clusterDoc.data().name;
      }
    } else if (data.clusterId === null) {
      // Se clusterId foi definido como null, remover o cluster
      updateData.clusterId = null;
      updateData.clusterName = null;
    }

    await updateDoc(docRef, updateData);
  }

  static async deleteMachine(id: string): Promise<void> {
    const docRef = doc(db, MACHINES_COLLECTION, id);
    await deleteDoc(docRef);
  }

  // Clusters
  static async getClusters(): Promise<Cluster[]> {
    const q = query(
      collection(db, CLUSTERS_COLLECTION),
      orderBy("name", "asc")
    );

    const querySnapshot = await getDocs(q);
    const clusters: Cluster[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      clusters.push({
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        createdBy: data.createdBy,
      });
    });

    return clusters;
  }

  static async createCluster(
    name: string,
    description: string,
    userId: string
  ): Promise<Cluster> {
    const now = new Date();
    const clusterData = {
      name,
      description,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };

    const docRef = await addDoc(
      collection(db, CLUSTERS_COLLECTION),
      clusterData
    );

    return {
      id: docRef.id,
      ...clusterData,
      createdAt: now,
      updatedAt: now,
    };
  }
}
