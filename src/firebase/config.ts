import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjuOyECZLC1XLbwxUcus4ul3wsJsB7RGo",
  authDomain: "cvsynthesizer.firebaseapp.com",
  projectId: "cvsynthesizer",
  storageBucket: "cvsynthesizer.firebasestorage.app",
  messagingSenderId: "266481008365",
  appId: "1:266481008365:web:d582da0bd30c41e8c456e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);