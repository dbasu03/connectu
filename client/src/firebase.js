

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut , onAuthStateChanged} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getDatabase, ref, set, onDisconnect, remove } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase config (Use REACT_APP_ variables)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
  
    
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const rtdb = getDatabase(app);
const storage = getStorage(app); // Initialize storage

// Function to sign in and collect user details
const signInWithGoogle = async (college, department, gender) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Reference to Firestore document
    const userDocRef = doc(db, "users", user.uid);

    // Check if user already exists
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      // Save user details in Firestore
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        college,
        department,
        gender
      });
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
  }
};

// Logout function
const logout = async () => {
  await signOut(auth);
  console.log("User signed out");
};

export { auth, db, rtdb, storage, signInWithGoogle, logout };


