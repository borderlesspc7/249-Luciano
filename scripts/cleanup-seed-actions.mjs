/**
 * Remove todos os registros inseridos pelos scripts de seed de actions overview.
 * Identifica pelo routeName ou pela chave de answers começando com "seed:"
 *
 * Uso: node scripts/cleanup-seed-actions.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

async function main() {
  console.log("== Cleanup Seed Actions Overview ==");

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

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId });
  }
  const db = admin.firestore();
  console.log(`Projeto Firebase: ${projectId}`);

  // ---- checklistDrafts ----
  console.log("[1/2] Buscando checklistDrafts de seed...");
  const draftsSnap = await db.collection("checklistDrafts").get();
  const draftIds = [];
  for (const doc of draftsSnap.docs) {
    const data = doc.data();
    const isSeedRoute =
      typeof data.routeName === "string" &&
      (data.routeName.startsWith("Rota Teste Actions") ||
        data.routeName === "Rota Seed Overview");
    const hasSeedAnswerKey =
      data.answers &&
      Object.keys(data.answers).some((k) => k.startsWith("seed:"));
    if (isSeedRoute || hasSeedAnswerKey) {
      draftIds.push(doc.id);
    }
  }
  console.log(`  Encontrados ${draftIds.length} drafts para remover.`);

  // ---- forwardedChecklists ----
  console.log("[2/2] Buscando forwardedChecklists de seed...");
  const fwdSnap = await db.collection("forwardedChecklists").get();
  const fwdIds = [];
  for (const doc of fwdSnap.docs) {
    const data = doc.data();
    const isSeedEquipment =
      typeof data.equipmentId === "string" &&
      data.equipmentId.startsWith("resolved:seed:");
    const isSeedRoute =
      typeof data.routeName === "string" &&
      (data.routeName.startsWith("Rota Teste Actions") ||
        data.routeName === "Rota Seed Overview");
    if (isSeedEquipment || isSeedRoute) {
      fwdIds.push(doc.id);
    }
  }
  console.log(`  Encontrados ${fwdIds.length} forwardedChecklists para remover.`);

  // ---- deletar em lotes de 500 (limite do Firestore batch) ----
  const allDeletes = [
    ...draftIds.map((id) => db.collection("checklistDrafts").doc(id)),
    ...fwdIds.map((id) => db.collection("forwardedChecklists").doc(id)),
  ];

  if (allDeletes.length === 0) {
    console.log("Nenhum registro de seed encontrado. Nada foi removido.");
    return;
  }

  const CHUNK = 500;
  for (let i = 0; i < allDeletes.length; i += CHUNK) {
    const batch = db.batch();
    allDeletes.slice(i, i + CHUNK).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  console.log(`✓ Cleanup concluído! Removidos: ${draftIds.length} drafts + ${fwdIds.length} forwardedChecklists.`);
}

main().catch((err) => {
  console.error("Falha:", err?.message || err);
  process.exitCode = 1;
});
