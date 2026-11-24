import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectFirestoreEmulator } from 'firebase/firestore';

const env = import.meta.env || {};

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
const missingKeys = requiredKeys.filter((key) => !env[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Configuracao Firebase incompleta. Defina no arquivo App/.env: ${missingKeys.join(', ')}`
  );
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

if (env.DEV && env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || '127.0.0.1', Number(env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080));
  connectFunctionsEmulator(functions, env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || '127.0.0.1', Number(env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001));
}
export const isFirebaseInitialized = true;
export default app;

