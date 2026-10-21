import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD0vBDSVrmerUmsqWee1aWvFB2NdGdyaSo',
  authDomain: 'ivai-conecta-4a366.firebaseapp.com',
  projectId: 'ivai-conecta-4a366',
  storageBucket: 'ivai-conecta-4a366.firebasestorage.app',
  messagingSenderId: '380692802322',
  appId: '1:380692802322:web:d0c01dc577883086cda1cb'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUsers() {
  const snap = await getDocs(collection(db, 'users'));
  console.log('Total users:', snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.avatar) {
      console.log(`[${d.id}] ${data.email || data.name} -> avatar: ${data.avatar.slice(0, 80)}`);
    } else {
      console.log(`[${d.id}] ${data.email || data.name} -> NO AVATAR`);
    }
  });
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
