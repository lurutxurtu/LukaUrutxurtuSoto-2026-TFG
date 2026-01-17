import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCj6o4ckpsrYPSl1lmfMitmOJF5uis_Xcc",
  authDomain: "splitcount-tfg-2026.firebaseapp.com",
  projectId: "splitcount-tfg-2026",
  storageBucket: "splitcount-tfg-2026.firebasestorage.app",
  messagingSenderId: "804979887017",
  appId: "1:804979887017:web:be6057eafb58c4e3d092b8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
