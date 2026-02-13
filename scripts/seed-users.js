/**
 * Cria um usuário por role (admin e user) no Firebase Auth + Firestore
 * e grava as credenciais em credenciais.txt e credenciais.env
 *
 * Uso: node scripts/seed-users.js
 * Requer: .env com VITE_FIREBASE_* preenchido
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  initializeApp,
  getApps,
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
dotenv.config({ path: join(rootDir, ".env") });

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const USERS = [
  {
    email: "admin@singenta.local",
    password: "SenhaAdmin123!",
    name: "Administrador",
    role: "admin",
  },
  {
    email: "user@singenta.local",
    password: "SenhaUser123!",
    name: "Usuário Comum",
    role: "user",
  },
];

function getApp() {
  if (getApps().length === 0) {
    return initializeApp(config);
  }
  return getApps()[0];
}

async function createUserAndProfile(auth, db, { email, password, name, role }) {
  const uc = await createUserWithEmailAndPassword(auth, email, password);
  const uid = uc.user.uid;
  const now = new Date();
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    name,
    role,
    status: "active",
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return { email, password, name, role };
}

async function main() {
  if (!config.apiKey || !config.projectId) {
    console.error("Erro: .env deve conter VITE_FIREBASE_API_KEY e VITE_FIREBASE_PROJECT_ID");
    process.exit(1);
  }

  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const created = [];

  for (const u of USERS) {
    try {
      const rec = await createUserAndProfile(auth, db, u);
      created.push(rec);
      console.log("Criado:", rec.email, "(" + rec.role + ")");
      await signOut(auth);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        console.log("Já existe:", u.email, "- usando mesma senha no arquivo de credenciais.");
        created.push({ email: u.email, password: u.password, name: u.name, role: u.role });
      } else {
        console.error("Erro ao criar", u.email, e.message);
        process.exit(1);
      }
    }
  }

  const admin = created.find((c) => c.role === "admin");
  const user = created.find((c) => c.role === "user");

  const txt = [
    "# Credenciais geradas por scripts/seed-users.js",
    "",
    "## Administrador",
    "Email: " + admin.email,
    "Senha: " + admin.password,
    "",
    "## Usuário",
    "Email: " + user.email,
    "Senha: " + user.password,
  ].join("\n");

  const env = [
    "# Credenciais (formato .env)",
    "ADMIN_EMAIL=" + admin.email,
    "ADMIN_PASSWORD=" + admin.password,
    "USER_EMAIL=" + user.email,
    "USER_PASSWORD=" + user.password,
  ].join("\n");

  const fs = await import("fs");
  const credTxt = join(rootDir, "credenciais.txt");
  const credEnv = join(rootDir, "credenciais.env");
  fs.writeFileSync(credTxt, txt, "utf8");
  fs.writeFileSync(credEnv, env, "utf8");
  console.log("\nCredenciais gravadas em:");
  console.log("  -", credTxt);
  console.log("  -", credEnv);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
