import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

function nowIso() {
  return new Date().toISOString();
}

function dayOffsetIso(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  dt.setHours(12, 0, 0, 0);
  return dt.toISOString();
}

function dateOnlyIso(value) {
  return value.slice(0, 10);
}

async function getLatestFolder(db) {
  const snap = await db.collection("checklistFolders").get();
  if (snap.empty) {
    return null;
  }

  const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  rows.sort((a, b) => {
    const av = String(a.updatedAt || a.createdAt || "");
    const bv = String(b.updatedAt || b.createdAt || "");
    return bv.localeCompare(av);
  });

  return rows[0];
}

async function main() {
  console.log("== Seed Actions Overview ==");
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const keyCandidates = [
    path.join(repoRoot, "firebase-service-account.json"),
    path.join(repoRoot, "firebase-service-account.json.json"),
  ];

  const keyPath = keyCandidates.find((candidate) => fs.existsSync(candidate));
  if (!keyPath) {
    throw new Error("Nao encontrei chave de service account. Esperado: firebase-service-account.json");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const projectId = serviceAccount.project_id;
  if (!projectId) {
    throw new Error("Service account invalida: project_id ausente.");
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  }
  const db = admin.firestore();
  console.log(`Usando service account: ${path.basename(keyPath)} (projectId=${projectId})`);

  console.log("[1/4] Buscando diretorio mais recente...");
  const latestFolder = await getLatestFolder(db);
  if (!latestFolder) {
    throw new Error("Nao ha diretorios em checklistFolders. Crie um diretorio primeiro.");
  }

  const userId = String(latestFolder.userId || "").trim();
  const projectName = String(latestFolder.projectName || "FW+").trim() || "FW+";
  const folderName = String(latestFolder.name || "Sem diretório").trim() || "Sem diretório";
  const areaName = String(latestFolder.areaName || "Sem área").trim() || "Sem área";
  const routeName = `Rota Teste Actions ${new Date().toISOString().slice(11, 19)}`;

  if (!userId) {
    throw new Error(`Diretorio ${latestFolder.id} sem userId. Nao foi possivel seed.`);
  }

  console.log("Diretorio escolhido:");
  console.log(`- id: ${latestFolder.id}`);
  console.log(`- userId: ${userId}`);
  console.log(`- projeto: ${projectName}`);
  console.log(`- area: ${areaName}`);
  console.log(`- diretorio: ${folderName}`);
  console.log(`- rota teste: ${routeName}`);

  console.log("[2/4] Inserindo draft com acao planejada...");
  const plannedDeadline = dayOffsetIso(3);
  const draftPayload = {
    userId,
    projectName,
    routeName,
    folderName,
    startDate: dateOnlyIso(dayOffsetIso(-1)),
    endDate: dateOnlyIso(dayOffsetIso(10)),
    equipmentIds: [],
    instrumentInstances: [],
    answers: {
      "seed:question:test_action": "no",
    },
    comments: {
      "seed:question:test_action": "Acao pendente de teste para grafico.",
    },
    activeTopicsIds: [],
    selectedBySection: {},
    questionResponsibles: {
      "seed:question:test_action": "Teste Seed",
    },
    questionPriorities: {
      "seed:question:test_action": "P2",
    },
    questionDeadlines: {
      "seed:question:test_action": dateOnlyIso(plannedDeadline),
    },
    questionLabels: {
      "seed:question:test_action": "Acao de teste (planejada)",
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const draftRef = await db.collection("checklistDrafts").add(draftPayload);
  console.log(`- draft criado: ${draftRef.id}`);

  console.log("[3/4] Inserindo acao realizada (resolved_action)...");
  const completedAt = nowIso();
  const resolvedPayload = {
    userId,
    equipmentId: "resolved:seed:question:test_action",
    equipmentName: "Acao de teste (realizada)",
    kind: "resolved_action",
    checklistRefId: draftRef.id,
    answers: {
      "seed:question:test_action": "yes",
    },
    comments: {
      "seed:question:test_action": "Resolvida para validacao do grafico.",
    },
    instrumentInstances: [],
    activeTopicsIds: [],
    selectedBySection: {},
    forwardedAt: completedAt,
    status: "done",
    completedAt,
    responsible: "Teste Seed",
    deadline: dateOnlyIso(dayOffsetIso(5)),
    priority: "P2",
    projectName,
    routeName,
    folderName,
    startDate: dateOnlyIso(dayOffsetIso(-1)),
    endDate: dateOnlyIso(dayOffsetIso(10)),
    questionLabels: {
      "seed:question:test_action": "Acao de teste (realizada)",
    },
    questionResponsibles: {
      "seed:question:test_action": "Teste Seed",
    },
    questionPriorities: {
      "seed:question:test_action": "P2",
    },
    questionDeadlines: {
      "seed:question:test_action": dateOnlyIso(dayOffsetIso(5)),
    },
  };
  const resolvedRef = await db.collection("forwardedChecklists").add(resolvedPayload);
  console.log(`- resolved_action criada: ${resolvedRef.id}`);

  console.log("[4/4] Seed concluido com sucesso.");
  console.log("Abra o app no mesmo projeto/usuario e verifique o card Actions Over View.");
}

main().catch((error) => {
  console.error("Falha no seed:", error?.message || error);
  process.exitCode = 1;
});
