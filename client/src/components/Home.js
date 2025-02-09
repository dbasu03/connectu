// Home.js
/*import React from "react";

const Home = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to connectu</h1>
      <p>Start swiping!</p>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/8/82/Tinder_logo.svg"
        alt="Tinder Logo"
        width="200"
      />
    </div>
  );
};

export default Home;
*/
/*
import React, { useState, useEffect } from "react";
import { auth, db, logout } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import "./Home.css"

const Home = () => {
  const [existingChats, setExistingChats] = useState([]);
  const [nextUser, setNextUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchChats = async () => {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("users", "array-contains", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const chatsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingChats(chatsData);
    };

    fetchChats();
  }, [auth.currentUser]); // ✅ Fetch existing chats

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchNextUser = async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "!=", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => !existingChats.some(chat => chat.users.includes(user.id)));

      if (users.length > 0) setNextUser(users[0]);
    };

    fetchNextUser();
  }, [auth.currentUser, existingChats]); // ✅ Fetch next user

  const startChat = async () => {
    if (!nextUser || !message) return;

    const newChat = {
      users: [auth.currentUser.uid, nextUser.id],
      createdAt: serverTimestamp(),
    };

    const chatRef = await addDoc(collection(db, "chats"), newChat);

    await addDoc(collection(db, "chats", chatRef.id, "messages"), {
      senderId: auth.currentUser.uid,
      text: message,
      timestamp: serverTimestamp(),
    });

    setMessage("");
    setNextUser(null);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <button onClick={logout} style={{ position: "absolute", top: 10, right: 10 }}>Logout</button>

      <h1>🔥 Tinder Clone 🔥</h1>

      <h2>Next Person You Can Text</h2>
      {nextUser ? (
        <div style={{ border: "1px solid gray", padding: "10px", marginBottom: "20px" }}>
          <p><strong>Gender:</strong> {nextUser.gender}</p>
          <p><strong>College:</strong> {nextUser.college}</p>
          <p><strong>Department:</strong> {nextUser.department}</p>

          <input
            type="text"
            placeholder="Send an opening message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={startChat}>Send</button>
        </div>
      ) : (
        <p>No new users available.</p>
      )}

      <h2>Your Existing Chats</h2>
      {existingChats.length > 0 ? (
        existingChats.map(chat => (
          <div key={chat.id} style={{ margin: "10px", padding: "10px", border: "1px solid gray" }}>
            <p>Chat with: {chat.users.find(id => id !== auth.currentUser.uid)}</p>
          </div>
        ))
      ) : (
        <p>No chats yet.</p>
      )}
    </div>
  );
};

export default Home;
*/

import React, { useState, useEffect } from "react";
import { auth, db, logout } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import "./Home.css"; // Import the CSS file for styling

const Home = () => {
  const [existingChats, setExistingChats] = useState([]);
  const [nextUser, setNextUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchChats = async () => {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("users", "array-contains", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const chatsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingChats(chatsData);
    };

    fetchChats();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchNextUser = async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "!=", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => !existingChats.some(chat => chat.users.includes(user.id)));

      if (users.length > 0) setNextUser(users[0]);
    };

    fetchNextUser();
  }, [auth.currentUser, existingChats]);

  const startChat = async () => {
    if (!nextUser || !message) return;

    const newChat = {
      users: [auth.currentUser.uid, nextUser.id],
      createdAt: serverTimestamp(),
    };

    const chatRef = await addDoc(collection(db, "chats"), newChat);

    await addDoc(collection(db, "chats", chatRef.id, "messages"), {
      senderId: auth.currentUser.uid,
      text: message,
      timestamp: serverTimestamp(),
    });

    setMessage("");
    setNextUser(null);
  };

  return (
    <div className="home-container">
      <button className="logout-button" onClick={logout}>Logout</button>

      <h1 className="title">connectu</h1>

      {/* ✅ Next Person to Chat */}
      <h2 className="section-title">Next Person You Can Text</h2>
      {nextUser ? (
        <div className="chat-card">
          <p><strong>Gender:</strong> {nextUser.gender}</p>
          <p><strong>College:</strong> {nextUser.college}</p>
          <p><strong>Department:</strong> {nextUser.department}</p>

          <input
            type="text"
            placeholder="Send an opening message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
          />
          <button className="send-button" onClick={startChat}>Send</button>
        </div>
      ) : (
        <p className="no-users">No new users available.</p>
      )}

      {/* ✅ Existing Chats */}
      <h2 className="section-title">Your Existing Chats</h2>
      {existingChats.length > 0 ? (
        existingChats.map(chat => (
          <div key={chat.id} className="chat-card">
            <p>Chat with: {chat.users.find(id => id !== auth.currentUser.uid)}</p>
          </div>
        ))
      ) : (
        <p className="no-users">No chats yet.</p>
      )}
    </div>
  );
};

export default Home;
