// Login.js
/*
import React from "react";
import { signInWithGoogle, logout } from "../firebase";

const Login = () => {
  return (
    <div>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Login;
*/

import React, { useState } from "react";
import { signInWithGoogle } from "../firebase";

const Login = () => {
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");

  const handleLogin = () => {
    if (!college || !department || !gender) {
      alert("Please fill in all fields before signing in.");
      return;
    }
    signInWithGoogle(college, department, gender);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>connectu</h1>

      <input
        type="text"
        placeholder="Enter your College Name"
        value={college}
        onChange={(e) => setCollege(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />

      <input
        type="text"
        placeholder="Enter your Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>

      <button onClick={handleLogin} style={{ marginTop: "10px" }}>
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
