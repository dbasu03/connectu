

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
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h1 style={styles.heading}>Welcome!</h1>
        <p style={styles.subheading}>We are so excited to see you here</p>

        <input
          type="text"
          placeholder="Enter your College Name"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Enter your Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={styles.input}
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={styles.input}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Transgender">Transgender</option>
          <option value="Bisexual">Bisexual</option>
          <option value="Genderfluid">Genderfluid</option>
          <option value="Cisgender">Cisgender</option>
          <option value="NonBinary">NonBinary</option>
          <option value="Agender">Agender</option>
          <option value="Bigender">Bigender</option>
          <option value="Other">Other</option>
        </select>

        <button onClick={handleLogin} style={styles.button}>
          Sign in with Google
        </button>
      </div>
      
      <footer style={styles.footer}>
        &copy; 2025 connectu. All rights reserved. No bots or fake profiles here
      </footer>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#2c2c2c",
    flexDirection: "column",
    padding: "20px",
    position: "relative",
    fontFamily: "'Inter Tight', sans-serif",
  },
  formContainer: {
    backgroundColor: "#1e1e1e",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    width: "90%",
    maxWidth: "350px",
    color: "white",
    height:"450px",
    fontFamily: "'Inter Tight', sans-serif",
  },
  heading: {
    marginBottom: "20px",
    fontFamily: "'Inter Tight', sans-serif",
  },
  subheading: {
    fontSize: "12px",
    marginBottom: "60px",
    fontFamily: "'Inter Tight', sans-serif",
  },
  input: {
    display: "block",
    margin: "10px auto",
    padding: "8px",
    width: "90%",
    fontFamily: "'Inter Tight', sans-serif",
    fontSize: "14px",
    backgroundColor: "white",
    color: "black",
    textAlign: "left",
    borderRadius: "5px",
    border: "none",
  },
  button: {
    marginTop: "20px",
    padding: "10px",
    width: "40%",
    left:"0",
    backgroundColor: "#b2b2b2",
    color: "black",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    alignSelf: "flex-start",
    fontFamily: "'Inter Tight', sans-serif",
  },
  footer: {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    textAlign: "center",
    color: "white",
    fontSize: "12px",
    padding: "0 0",
    backgroundColor: "#121212",
  },
};

export default Login;

