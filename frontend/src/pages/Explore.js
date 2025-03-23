import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Explore.css";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchExploreData = async () => {
      try {
        const usersResponse = await axios.get(
          `http://127.0.0.1:8000/images/explore/users/?search=${searchQuery}`
        );
        const imagesResponse = await axios.get(
          `http://127.0.0.1:8000/images/explore/images/?search=${searchQuery}`
        );
        const albumsResponse = await axios.get(
          `http://127.0.0.1:8000/images/explore/albums/?search=${searchQuery}`
        );

        setUsers(usersResponse.data);
        setImages(imagesResponse.data);
        setAlbums(albumsResponse.data);
      } catch (error) {
        console.error("Failed to fetch explore data:", error);
      }
    };

    fetchExploreData();
  }, [searchQuery, navigate]);

  return (
    <div className="explore-container">
      <h2 className="explore-title">Explore</h2>
  
      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search users, images, albums..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="explore-search"
      />
  
      {/* 👤 Users Section */}
      <div className="explore-section">
        <h3 className="explore-section-title">Users</h3>
        <div className="users-grid">
          {users.map((user) => (
            <div key={user.id} className="user-card" onClick={() => navigate(`/profile/${user.id}`)}>
              <img
                src={user.profile_picture || "https://via.placeholder.com/100"}
                alt={`${user.username}'s profile`}
                className="user-profile-pic"
              />
              <p>{user.username}</p>
            </div>
          ))}
        </div>
      </div>
  
      {/* 🖼️ Images Section */}
      <div className="explore-section">
        <h3 className="explore-section-title">Images</h3>
        <div className="images-grid">
          {images.map((img) => (
            <div key={img.id} className="image-card" onClick={() => navigate(`/image/${img.id}`)}>
              <img src={img.image_url} alt={`${img.posted_by}`} />
            </div>
          ))}
        </div>
      </div>
  
      {/* 🎨 Albums Section */}
      <div className="explore-section">
        <h3 className="explore-section-title">Albums</h3>
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" onClick={() => navigate(`/album/${album.id}`)}>
              <p>{album.name} (by {album.owner})</p>
              <img src={album.cover_image_url} alt={`Album cover for ${album.name}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
};

export default Explore;
