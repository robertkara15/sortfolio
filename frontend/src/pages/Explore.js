// This page allows users to search for and browse public users, images, and albums,
// with options to filter by tags and sort by various criteria.

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Explore.css";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [sortOption, setSortOption] = useState("latest");
  const [tagFilter, setTagFilter] = useState("");

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

        let filteredImages = imagesResponse.data;
        let filteredAlbums = albumsResponse.data;

        // Filter images and albums based on the tag filter
        if (tagFilter) {
          filteredImages = filteredImages.filter(img =>
            img.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
          );
          filteredAlbums = filteredAlbums.filter(album =>
            album.name?.toLowerCase().includes(tagFilter.toLowerCase())
          );
        }

        // Sort images and albums based on the selected option
        if (sortOption === "latest") {
          filteredImages.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        } else if (sortOption === "earliest") {
          filteredImages.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
        } else if (sortOption === "az") {
          filteredImages.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          filteredAlbums.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }

        setUsers(usersResponse.data);
        setImages(filteredImages);
        setAlbums(filteredAlbums);
      } catch (error) {
        console.error("Failed to fetch explore data:", error);
      }
    };

    fetchExploreData();
  }, [searchQuery, tagFilter, sortOption, navigate]);

  return (
    <div className="explore-container">
      <h2 className="explore-title">Explore</h2>

      {/* Search + Sort + Filter Controls */}
      <div className="explore-controls">
        <input
          type="text"
          placeholder="Search users, images, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="explore-search"
        />

        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="explore-select">
          <option value="latest">Sort by: Latest</option>
          <option value="earliest">Sort by: Earliest</option>
          <option value="az">Sort by: A-Z</option>
        </select>

        <input
          type="text"
          placeholder="Filter by tag or album name"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="explore-filter"
        />
      </div>

      {/* Users */}
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

      {/* Images */}
      <div className="explore-section">
        <h3 className="explore-section-title">Images</h3>
        <div className="images-grid">
          {images.map((img) => (
            <div key={img.id} className="image-card" onClick={() => navigate(`/image/${img.id}`)}>
              <img src={img.image_url} alt={img.name || "Image"} />
            </div>
          ))}
        </div>
      </div>

      {/* Albums */}
      <div className="explore-section">
        <h3 className="explore-section-title">Albums</h3>
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" onClick={() => navigate(`/album/${album.id}`)}>
              <p>{album.name} (by {album.owner})</p>
              <img src={album.cover_image_url || "https://via.placeholder.com/200"} alt={`Album cover for ${album.name}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
