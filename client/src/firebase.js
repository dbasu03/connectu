// firebase.js
/*import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCarcd6nX8fRy_eBotx2Fah-exMfoSJxxs",
    authDomain: "connectu2dworld.firebaseapp.com",
    projectId: "connectu2dworld",
    storageBucket: "connectu2dworld.firebasestorage.app",
    messagingSenderId: "1033797684110",
    appId: "1:1033797684110:web:377787555ec10a845672df",
    measurementId: "G-91SVC22JYQ"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Send token to backend
    const idToken = await user.getIdToken();
    await fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    console.log("User signed in:", user);
  } catch (error) {
    console.error("Google sign-in error:", error);
  }
};

const logout = async () => {
  await signOut(auth);
  console.log("User signed out");
};

export { auth, signInWithGoogle, logout };
*/


import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCarcd6nX8fRy_eBotx2Fah-exMfoSJxxs",
    authDomain: "connectu2dworld.firebaseapp.com",
    projectId: "connectu2dworld",
    storageBucket: "connectu2dworld.firebasestorage.app",
    messagingSenderId: "1033797684110",
    appId: "1:1033797684110:web:377787555ec10a845672df",
    measurementId: "G-91SVC22JYQ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

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

export { auth, db, signInWithGoogle, logout };
