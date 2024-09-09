import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  databaseURL:
    "https://suit-the-game-default-rtdb.asia-southeast1.firebasedatabase.app/",
  apiKey: "AIzaSyDtfo4zGC5VHbdyW5kV8z2_53DVwX5wSwI",
  authDomain: "suit-the-game.firebaseapp.com",
  projectId: "suit-the-game",
  storageBucket: "suit-the-game.appspot.com",
  messagingSenderId: "75053800922",
  appId: "1:75053800922:web:35330b86d9c80cb8f1b4e3",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export { db };
