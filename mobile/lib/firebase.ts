import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Use env vars: EXPO_PUBLIC_FIREBASE_* (crie mobile/.env a partir do .env da web)
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "";
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "";

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

let app: FirebaseApp;
let auth: ReturnType<typeof initializeAuth>;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} else {
  app = getApps()[0] as FirebaseApp;
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

// Para persistência offline completa do Firestore no mobile, use depois
// @react-native-firebase/firestore (com Expo Dev Client). O SDK web aqui
// já faz cache de leituras quando há rede; offline total exige RN Firebase.

export default app;
