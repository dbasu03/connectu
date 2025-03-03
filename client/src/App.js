

import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./components/Home";
import Login from "./components/Login";
import Avatar from "./components/Avatar.js";
import Chatroom from "./components/Chatroom.js";
import usePresence from "./components/usePresence.js";
import Confessions from "./components/Confessions.js";

const App = () => {
  const [user, setUser] = useState(null);
  const [showHome, setShowHome] = useState(false);
  const [showChatroom, setShowChatroom] = useState(false);
  const [showConfessions, setShowConfessions] = useState(false);

  usePresence();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setShowHome(false);    // Ensure Home is not active
        setShowChatroom(false); // Ensure Chatroom is not active
        setShowConfessions(false);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  return (
    <div>
      {!user ? (
        <Login />
      ) : showChatroom ? (
        <Chatroom setShowChatroom={setShowChatroom} />
      ) : showConfessions ? (
        <Confessions setShowConfessions={setShowConfessions} />
      ) : showHome ? (
        <Home setShowChatroom={setShowChatroom} setShowHome={setShowHome} />
      ) : (
        <Avatar setShowHome={setShowHome} />
      )}
    </div>
  );
};

export default App;

