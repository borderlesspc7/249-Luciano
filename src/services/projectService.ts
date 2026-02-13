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
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "../types/projects";

const PROJECTS_COLLECTION = "projects";
const USERS_COLLECTION = "users";

export class ProjectService {
  static async createProject(
    data: CreateProjectData,
    userId: string
  ): Promise<Project> {
    const now = new Date();
    const projectData: any = {
      name: data.name,
      status: "active" as const,
      startDate: Timestamp.fromDate(data.startDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
      updatedBy: userId,
    };

    if (data.description) {
      projectData.description = data.description;
    }
    if (data.expectedEndDate) {
      projectData.expectedEndDate = Timestamp.fromDate(data.expectedEndDate);
    }
    if (data.managerId) {
      projectData.managerId = data.managerId;
      // Buscar nome do gerente
      const managerDoc = await getDoc(doc(db, USERS_COLLECTION, data.managerId));
      if (managerDoc.exists()) {
        projectData.managerName = managerDoc.data().name;
      }
    }

    const docRef = await addDoc(
      collection(db, PROJECTS_COLLECTION),
      projectData
    );

    return {
      id: docRef.id,
      ...projectData,
      startDate: data.startDate,
      expectedEndDate: data.expectedEndDate,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async getProjects(): Promise<Project[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      projects.push({
        id: docSnapshot.id,
        name: data.name || "",
        description: data.description,
        status: data.status || "active",
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        expectedEndDate: data.expectedEndDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
        managerId: data.managerId,
        managerName: data.managerName,
      });
    });

    return projects;
  }

  static async getProject(projectId: string): Promise<Project | null> {
    const docSnap = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || "",
      description: data.description,
      status: data.status || "active",
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate(),
      expectedEndDate: data.expectedEndDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || "",
      updatedBy: data.updatedBy || "",
      managerId: data.managerId,
      managerName: data.managerName,
    };
  }

  static async updateProject(
    projectId: string,
    data: UpdateProjectData,
    userId: string
  ): Promise<void> {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
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
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = Timestamp.fromDate(data.startDate);
    }
    if (data.endDate !== undefined) {
      updateData.endDate = Timestamp.fromDate(data.endDate);
    }
    if (data.expectedEndDate !== undefined) {
      updateData.expectedEndDate = Timestamp.fromDate(data.expectedEndDate);
    }
    if (data.managerId !== undefined) {
      updateData.managerId = data.managerId;
      if (data.managerId) {
        // Buscar nome do gerente
        const managerDoc = await getDoc(doc(db, USERS_COLLECTION, data.managerId));
        if (managerDoc.exists()) {
          updateData.managerName = managerDoc.data().name;
        }
      } else {
        updateData.managerName = null;
      }
    }

    await updateDoc(docRef, updateData);
  }

  static async deleteProject(projectId: string): Promise<void> {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
  }

  static async getProjectsByStatus(
    status: "active" | "completed" | "overdue" | "cancelled"
  ): Promise<Project[]> {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      projects.push({
        id: docSnapshot.id,
        name: data.name || "",
        description: data.description,
        status: data.status || "active",
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        expectedEndDate: data.expectedEndDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || "",
        updatedBy: data.updatedBy || "",
        managerId: data.managerId,
        managerName: data.managerName,
      });
    });

    return projects;
  }
}
