/**
 * Popula o banco com dados distribuídos pelas últimas 6 semanas
 * para o gráfico "Actions Over View" aparecer com dados reais.
 *
 * Uso: node scripts/seed-actions-overview-populate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

function nowIso() {
  return new Date().toISOString();
}

/**
 * Retorna a segunda-feira da semana que contém `date`.
 */
function startOfWeek(date) {
  const dt = new Date(date);
  dt.setHours(12, 0, 0, 0);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

/**
 * Gera a data ISO da segunda-feira da semana N semanas atrás (0 = semana atual).
 */
function weekStartIsoAgo(weeksAgo) {
  const now = new Date();
  const monday = startOfWeek(now);
  monday.setDate(monday.getDate() - weeksAgo * 7);
  return monday.toISOString().slice(0, 10);
}

/**
 * Adiciona dias a uma data ISO e retorna ISO.
 */
function addDays(isoDate, days) {
  const dt = new Date(isoDate);
  dt.setHours(12, 0, 0, 0);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString();
}

async function getLatestFolder(db) {
  const snap = await db.collection("checklistFolders").get();
  if (snap.empty) return null;

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => {
    const av = String(a.updatedAt || a.createdAt || "");
    const bv = String(b.updatedAt || b.createdAt || "");
    return bv.localeCompare(av);
  });
  return rows[0];
}

async function main() {
  console.log("== Seed Actions Overview (6 semanas) ==");

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const keyCandidates = [
    path.join(repoRoot, "firebase-service-account.json"),
    path.join(repoRoot, "firebase-service-account.json.json"),
  ];
  const keyPath = keyCandidates.find((p) => fs.existsSync(p));
  if (!keyPath) throw new Error("Service account não encontrado.");

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const projectId = serviceAccount.project_id;
  if (!projectId) throw new Error("project_id ausente na service account.");

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId });
  }
  const db = admin.firestore();
  console.log(`Projeto Firebase: ${projectId}`);

  console.log("[1/3] Buscando diretório mais recente...");
  const latestFolder = await getLatestFolder(db);
  if (!latestFolder) throw new Error("Nenhum checklistFolder encontrado. Crie um diretório primeiro.");

  const userId = String(latestFolder.userId || "").trim();
  const projectName = String(latestFolder.projectName || "FW+").trim() || "FW+";
  const folderName = String(latestFolder.name || "Sem diretório").trim();
  const routeName = "Rota Seed Overview";

  if (!userId) throw new Error(`Folder ${latestFolder.id} sem userId.`);

  console.log(`  userId: ${userId}`);
  console.log(`  projeto: ${projectName} | folder: ${folderName} | rota: ${routeName}`);

  /**
   * Distribuição de ações pelas últimas 6 semanas:
   * Semana 1 (mais antiga): 2 planejadas, 1 realizada
   * Semana 2: 3 planejadas, 2 realizadas
   * Semana 3: 4 planejadas, 3 realizadas
   * Semana 4: 5 planejadas, 4 realizadas
   * Semana 5: 3 planejadas, 5 realizadas
   * Semana 6 (atual): 4 planejadas, 3 realizadas
   */
  const weekPlan = [
    { weeksAgo: 5, planned: 2, realized: 1 },
    { weeksAgo: 4, planned: 3, realized: 2 },
    { weeksAgo: 3, planned: 4, realized: 3 },
    { weeksAgo: 2, planned: 5, realized: 4 },
    { weeksAgo: 1, planned: 3, realized: 5 },
    { weeksAgo: 0, planned: 4, realized: 3 },
  ];

  let totalDrafts = 0;
  let totalResolved = 0;
  const batch = db.batch();

  console.log("[2/3] Gerando registros por semana...");
  for (const week of weekPlan) {
    const weekStart = weekStartIsoAgo(week.weeksAgo);

    for (let i = 0; i < week.planned; i++) {
      const deadlineIso = addDays(weekStart, 2 + i).slice(0, 10);
      const qKey = `seed:w${week.weeksAgo}:planned:${i}`;
      const ref = db.collection("checklistDrafts").doc();
      batch.set(ref, {
        userId,
        projectName,
        routeName,
        folderName,
        startDate: addDays(weekStart, 0).slice(0, 10),
        endDate: addDays(weekStart, 6).slice(0, 10),
        equipmentIds: [],
        instrumentInstances: [],
        answers: { [qKey]: "no" },
        comments: { [qKey]: `Ação planejada seed — semana -${week.weeksAgo}, item ${i + 1}` },
        activeTopicsIds: [],
        selectedBySection: {},
        questionResponsibles: { [qKey]: "Seed Script" },
        questionPriorities: { [qKey]: "P2" },
        questionDeadlines: { [qKey]: deadlineIso },
        questionLabels: { [qKey]: `Ação planejada W-${week.weeksAgo} #${i + 1}` },
        createdAt: addDays(weekStart, 0),
        updatedAt: addDays(weekStart, 0),
      });
      totalDrafts++;
    }

    for (let i = 0; i < week.realized; i++) {
      const completedAt = addDays(weekStart, 1 + i);
      const qKey = `seed:w${week.weeksAgo}:realized:${i}`;
      const ref = db.collection("forwardedChecklists").doc();
      batch.set(ref, {
        userId,
        equipmentId: `resolved:seed:w${week.weeksAgo}:${i}`,
        equipmentName: `Ação realizada seed W-${week.weeksAgo} #${i + 1}`,
        kind: "resolved_action",
        answers: { [qKey]: "yes" },
        comments: { [qKey]: `Ação realizada seed — semana -${week.weeksAgo}, item ${i + 1}` },
        instrumentInstances: [],
        activeTopicsIds: [],
        selectedBySection: {},
        forwardedAt: completedAt,
        status: "done",
        completedAt,
        responsible: "Seed Script",
        priority: "P2",
        projectName,
        routeName,
        folderName,
        startDate: addDays(weekStart, 0).slice(0, 10),
        endDate: addDays(weekStart, 6).slice(0, 10),
        questionLabels: { [qKey]: `Ação realizada W-${week.weeksAgo} #${i + 1}` },
        questionResponsibles: { [qKey]: "Seed Script" },
        questionPriorities: { [qKey]: "P2" },
        questionDeadlines: { [qKey]: addDays(weekStart, 6).slice(0, 10) },
      });
      totalResolved++;
    }

    console.log(
      `  Semana -${week.weeksAgo} (${weekStart}): ${week.planned} planejadas + ${week.realized} realizadas`
    );
  }

  console.log(`[3/3] Commitando ${totalDrafts} drafts e ${totalResolved} resolved_actions...`);
  await batch.commit();

  console.log("✓ Seed concluído!");
  console.log(`  Total drafts inseridos: ${totalDrafts}`);
  console.log(`  Total realizadas inseridas: ${totalResolved}`);
  console.log(
    `  Abra o app logado como userId=${userId}, projeto="${projectName}" e veja o card Actions Over View.`
  );
}

main().catch((err) => {
  console.error("Falha:", err?.message || err);
  process.exitCode = 1;
});
