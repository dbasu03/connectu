// App.js
/*
import React, { useState, useEffect } from "react";
import { auth, signInWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./components/Home";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth is undefined!");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>connectu</h1>
      {user ? (
        <div>
          <img
            src={user.photoURL}
            alt="User Profile"
            style={{ borderRadius: "50%", width: "100px", height: "100px" }}
          />
          <h2>Welcome, {user.displayName}!</h2>
          <p>Email: {user.email}</p>
          <button onClick={logout}>Logout</button>
          <Home/>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
};

export default App;
*/
/*
import React, { useState, useEffect } from "react";
import { auth, logout } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./components/Home";
import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? (
        <>
          <button onClick={logout} style={{ position: "absolute", top: 10, right: 10 }}>
            Logout
          </button>
          <Home />
        </>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;
*/

import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./components/Home";
import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>{user ? <Home /> : <Login />}</div>
  );
};

export default App;
