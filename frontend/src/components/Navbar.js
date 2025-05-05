// This component defines the navigation bar for the application.
// It includes links to key sections such as Dashboard, Upload, Analytics, and Explore.
// The navigation bar also displays the user's profile picture and provides a dropdown menu
// for accessing the profile page or logging out.

import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePic, setProfilePic] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setProfilePic(null);
        return;
      }
  
      try {
        const res = await axios.get("http://127.0.0.1:8000/users/profile/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const picUrl = res.data.profile_picture
          ? `${res.data.profile_picture}?t=${Date.now()}`
          : null;
        setProfilePic(picUrl);
      } catch (error) {
        console.error("Failed to fetch profile picture:", error);
        setProfilePic(null);
      }
    };
  
    fetchProfile();
  }, [location.pathname]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setProfilePic(null);
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>Sortfolio</h2>

      {!isAuthPage && (
        <div style={styles.links}>
          <NavLink to="/dashboard" style={styles.link}>Dashboard</NavLink>
          <NavLink to="/upload" style={styles.link}>Upload</NavLink>
          <NavLink to="/analytics" style={styles.link}>Analytics</NavLink>
          <NavLink to="/explore" style={styles.link}>Explore</NavLink>

          <div style={styles.profileWrapper} ref={dropdownRef}>
            <img
              src={profilePic || "/default-avatar.png"}
              alt="Profile"
              style={styles.profilePic}
              onClick={() => setDropdownOpen((prev) => !prev)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />

            {dropdownOpen && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => navigate("/profile/me")}>My Profile</div>
                <div style={styles.dropdownItem} onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    backgroundColor: "#1c1c1c",
    color: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },
  logo: {
    fontSize: "26px",
    fontWeight: "bold",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    position: "relative",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "16px",
    padding: "8px",
    transition: "color 0.3s",
  },
  profileWrapper: {
    position: "relative",
    marginLeft: "15px",
    cursor: "pointer",
  },
  profilePic: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid white",
  },
  dropdown: {
    position: "absolute",
    top: "50px",
    right: 0,
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "8px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    width: "150px",
    zIndex: 999,
  },
  dropdownItem: {
    padding: "10px 15px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
  },
};

export default Navbar;
