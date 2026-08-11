/**
 * IVAÍ CONECTA - FIREBASE CONFIGURATION & INITIALIZATION
 * Projeto de Extensão IFPR Campus Ivaiporã
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Configuração Oficial do Firebase Console (ivai-conecta-4a366)
const firebaseConfig = window.FIREBASE_ENV_CONFIG || {
  apiKey: "AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo",
  authDomain: "ivai-conecta-4a366.firebaseapp.com",
  projectId: "ivai-conecta-4a366",
  storageBucket: "ivai-conecta-4a366.firebasestorage.app",
  messagingSenderId: "380692802322",
  appId: "1:380692802322:web:d0c01dc577883086cda1cb",
  measurementId: "G-HGGXZ0FYTR"
};

let app = null;
let db = null;
let auth = null;
let isFirebaseInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseInitialized = true;
  console.log('⚡ Firebase [Ivaí Conecta] inicializado com sucesso!');
} catch (error) {
  console.warn('⚠️ Firebase não inicializado (modo demonstração local ativado):', error.message);
}

export { app, db, auth, isFirebaseInitialized };
