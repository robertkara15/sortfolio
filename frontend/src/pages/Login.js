import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      console.error("Login error:", error); // Logs full error for debugging

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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>

      {/* Button to go to Register Page */}
      <p>Don't have an account?</p>
      <button onClick={() => navigate("/register")}>Register</button>
    </div>
  );
}

export default Login;
