import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Profile.css";

const Profile = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [userAlbums, setUserAlbums] = useState([]);
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

        const actualUserId = response.data.id;
        setIsOwner(userId === "me");

        // Fetch User Images
        const imagesResponse = await axios.get(
          `http://127.0.0.1:8000/images/user-images/${actualUserId}/`,
          { headers }
        );
        setUserImages(imagesResponse.data);

        // Fetch User Albums
        const albumsResponse = await axios.get(
          `http://127.0.0.1:8000/images/user-albums/${actualUserId}/`,
          { headers }
        );
        setUserAlbums(albumsResponse.data);

      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfileData();
  }, [userId, navigate]);

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
  
      const response = await axios.post(
        "http://127.0.0.1:8000/users/update-profile-picture/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      alert("Profile picture updated!");
      setProfileData((prev) => ({
        ...prev,
        profile_picture: response.data.profile_picture_url,
      }));
      setSelectedFile(null);
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

  const deleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("token");

        await axios.delete("http://127.0.0.1:8000/users/delete-account/", {
            headers: { Authorization: `Bearer ${token}` },
        });

        alert("Your account has been deleted.");
        localStorage.removeItem("token");
        navigate("/login"); 

    } catch (error) {
        console.error("Failed to delete account:", error);
        alert("Failed to delete account.");
    }
  };
  

  if (!profileData) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">{isOwner ? "My Profile" : `${profileData.username}'s Profile`}</h2>

      <img
        src={
          profileData.profile_picture
            ? `${profileData.profile_picture}?t=${Date.now()}`
            : "https://via.placeholder.com/150"
        }
        alt={profileData.username}
        className="profile-picture"
      />


      {isOwner ? (
        <div className="upload-section">
          <label className="custom-file-input">
            Choose File
            <input type="file" onChange={handleFileChange} accept="image/*" />
          </label>
          <div className="profile-buttons">
            <button className="update-btn" onClick={handleUpload}>Upload New Profile Picture</button>
          </div>

          <p className="profile-info"><strong>First Name:</strong> {profileData.first_name}</p>
          <p className="profile-info"><strong>Last Name:</strong> {profileData.last_name}</p>
          <p className="profile-info"><strong>Images Uploaded:</strong> {profileData.image_count}</p>

          <h3>Update Info</h3>
          <form className="profile-form" onSubmit={async (e) => {
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
          }}>
            <input type="text" placeholder="First Name" value={profileData.first_name || ""} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} />
            <input type="text" placeholder="Last Name" value={profileData.last_name || ""} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} />
            <button type="submit">Update Profile</button>
            
          </form>

          <h3>Change Password</h3>
          <form className="profile-form" onSubmit={handlePasswordChange}>
            <input type="password" name="oldPassword" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <input type="password" name="newPassword" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input type="password" name="confirmPassword" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="submit">Change Password</button>
          </form>

          <button onClick={deleteAccount} className="delete-btn">Delete Account</button>
          
        </div>
      ) : (
        <div>
          <p><strong>{profileData.username}</strong> has uploaded {profileData.image_count} images.</p>

          <h3>{profileData.username}'s Albums</h3>
          <div className="albums-grid">
            {userAlbums.length > 0 ? (
              userAlbums.map((album) => (
                <div key={album.id} className="album-card" onClick={() => navigate(`/album/${album.id}`)}>
                  <img src={album.cover_image_url || "https://via.placeholder.com/150"} alt={album.album_name} />
                  <p>{album.name}</p>
                </div>
              ))
            ) : (
              <p>This user has no albums.</p>
            )}
          </div>

          <h3>{profileData.username}'s Images</h3>
          <div className="images-grid">
            {userImages.length > 0 ? (
              userImages.map((image) => (
                <div key={image.id} className="image-card" onClick={() => navigate(`/image/${image.id}`)}>
                  <img src={image.image_url || "https://via.placeholder.com/150"} alt="User Upload" />
                </div>
              ))
            ) : (
              <p>This user has not uploaded any images.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;