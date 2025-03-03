import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      navigate("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log(`Fetching profile for userId: ${userId}`);

        const response = await axios.get(
          `http://127.0.0.1:8000/users/profile/${userId || "me"}/`,
          { headers }
        );
        setProfileData(response.data);

        setIsOwner(userId === "me");
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Handle Profile Picture Upload
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profile_picture", selectedFile);

      await axios.post(
        "http://127.0.0.1:8000/users/update-profile-picture/",
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      alert("Profile picture updated!");
      window.location.reload();
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      alert("Failed to upload profile picture.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
  
    if (!oldPassword) {
      alert("Please enter your old password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/users/update-profile/",
        {
          old_password: oldPassword,
          password: newPassword,
          confirm_password: confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data.error) {
        alert(`${response.data.error}`);
        return;
      }
  
      alert("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to change password:", error.response?.data);
      alert(error.response?.data?.error || "Failed to change password. Please try again.");
    }
  };
  

  if (!profileData) return <p>Loading...</p>;

  return (
    <div>
      <h2>{isOwner ? "My Profile" : `${profileData.username}'s Profile`}</h2>

      <div>
        <img
          src={profileData.profile_picture || "https://via.placeholder.com/150"}
          alt={profileData.username}
          width="150"
          height="150"
          style={{ borderRadius: "50%", objectFit: "cover", marginBottom: "10px" }}
        />
      </div>

      {isOwner ? (
        <div>
          <input type="file" onChange={handleFileChange} accept="image/*" />
          <button onClick={handleUpload}>Upload New Profile Picture</button>

          <p><strong>First Name:</strong> {profileData.first_name}</p>
          <p><strong>Last Name:</strong> {profileData.last_name}</p>
          <p><strong>Images Uploaded:</strong> {profileData.image_count}</p>

          <h3>Update Info</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem("token");
              const updatedData = {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
              };

              try {
                await axios.post(
                  "http://127.0.0.1:8000/users/update-profile/",
                  updatedData,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                alert("Profile updated successfully!");
              } catch (error) {
                console.error("Failed to update profile:", error);
              }
            }}
          >
            <input
              type="text"
              placeholder="First Name"
              value={profileData.first_name || ""}
              onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={profileData.last_name || ""}
              onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
            />
            <button type="submit">Update Profile</button>
          </form>

          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <input
              type="password"
              name="oldPassword"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit">Change Password</button>
          </form>
        </div>
      ) : (
        <p><strong>{profileData.username}</strong> has uploaded {profileData.image_count} images.</p>
      )}
    </div>
  );
};

export default Profile;
