import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration
// IMPORTANTE: Estas credenciales deben ser reemplazadas con las de tu proyecto Firebase
const getEnvVar = (key: string, viteKey: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID')
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.projectId && 
         firebaseConfig.apiKey !== "YOUR_API_KEY" &&
         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

export const FIREBASE_ENABLED = isFirebaseConfigured();

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (FIREBASE_ENABLED) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    console.warn('⚠️ Usando localStorage como fallback');
  }
} else {
}

export { app, auth, db };
export default app;
