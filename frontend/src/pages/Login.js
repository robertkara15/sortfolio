import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/users/login/", {
        username,
        password,
      });

      // Save token in localStorage
      localStorage.setItem("token", res.data.access);

      alert("Login successful!");
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "An error occurred. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.error || "Invalid credentials.";
      } else if (error.request) {
        errorMessage = "No response from server. Check backend connection.";
      } else {
        errorMessage = "Request error. Check console for details.";
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="login-btn">Login</button>
      </form>

      <p className="login-helper">Don't have an account?</p>
      <button className="register-btn" onClick={() => navigate("/register")}>Register</button>
    </div>
  );
}

export default Login;
