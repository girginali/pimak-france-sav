import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtg0Ji4H0eiR31TT2LTh03lp1htt936nM",
  authDomain: "pimak-france.firebaseapp.com",
  projectId: "pimak-france",
  storageBucket: "pimak-france.firebasestorage.app",
  messagingSenderId: "1070636077372",
  appId: "1:1070636077372:web:43ec5ab9b6501e2cc94e39",
  measurementId: "G-8BXYMMFL7C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
