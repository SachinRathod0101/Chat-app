import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBMt0IFgxXRR3pV0K9e9LjAA45vwp_n8-Y",
  authDomain: "menu-88dc7.firebaseapp.com",
  databaseURL: "https://menu-88dc7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "menu-88dc7",
  storageBucket: "menu-88dc7.firebasestorage.app",
  messagingSenderId: "39933974739",
  appId: "39933974739:web:a652e5ea63f9c8486b9c26"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const storage = getStorage(app);

export { app, database };
