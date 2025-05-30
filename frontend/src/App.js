import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import AlbumPage from "./pages/AlbumPage";
import ImageDetail from "./pages/ImageDetail";
import Analytics from "./pages/Analytics";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/album/:albumId" element={<AlbumPage />} /> 
        <Route path="/image/:imageId" element={<ImageDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
