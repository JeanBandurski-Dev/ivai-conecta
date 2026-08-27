import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            'AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo',
  authDomain:        'ivai-conecta-4a366.firebaseapp.com',
  projectId:         'ivai-conecta-4a366',
  storageBucket:     'ivai-conecta-4a366.firebasestorage.app',
  messagingSenderId: '380692802322',
  appId:             '1:380692802322:web:d0c01dc577883086cda1cb',
  measurementId:     'G-HGGXZ0FYTR',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseInitialized = true;
export default app;

