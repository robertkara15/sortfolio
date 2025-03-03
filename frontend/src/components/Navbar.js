import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>Sortfolio</h2>

      {!isAuthPage && (
        <div style={styles.links}>
          <NavLink to="/dashboard" style={styles.link} activeStyle={styles.activeLink}>Dashboard</NavLink>
          <NavLink to="/upload" style={styles.link} activeStyle={styles.activeLink}>Upload</NavLink>
          <NavLink to="/analytics" style={styles.link} activeStyle={styles.activeLink}>Analytics</NavLink>
          <NavLink to="/explore" style={styles.link} activeStyle={styles.activeLink}>Explore</NavLink>
          <NavLink to="/profile/me" style={styles.link} activeStyle={styles.activeLink}>My Profile</NavLink>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      )}
    </nav>
  );
};

// Styles for Navbar
const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1px 20px",
    backgroundColor: "#333",
    color: "#fff",
  },
  logo: {
    fontSize: "30px",
  },
  links: {
    display: "flex",
    alignItems: "center",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    padding: "10px 15px",
  },
  activeLink: {
    fontWeight: "bold",
    borderBottom: "2px solid #fff",
  },
  logoutButton: {
    backgroundColor: "red",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    marginLeft: "10px",
    cursor: "pointer",
  },
};

export default Navbar;
