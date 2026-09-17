import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKC_M4Vai0I4ejV4cVcTLGU0DglzDzIrU",
  authDomain: "hr-website-6c387.firebaseapp.com",
  projectId: "hr-website-6c387",
  storageBucket: "hr-website-6c387.firebasestorage.app",
  messagingSenderId: "956416732466",
  appId: "1:956416732466:web:c5827105d00b9de756bb2b",
  measurementId: "G-07P2NXYQK8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default app;
