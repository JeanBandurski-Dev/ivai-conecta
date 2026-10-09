import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY || 'AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo',
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN || 'ivai-conecta-4a366.firebaseapp.com',
  projectId:         env.VITE_FIREBASE_PROJECT_ID || 'ivai-conecta-4a366',
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET || 'ivai-conecta-4a366.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '380692802322',
  appId:             env.VITE_FIREBASE_APP_ID || '1:380692802322:web:d0c01dc577883086cda1cb',
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HGGXZ0FYTR',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseInitialized = true;
export default app;

