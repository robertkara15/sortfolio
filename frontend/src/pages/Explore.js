import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const navigate = useNavigate();

  // Fetch explore data
  useEffect(() => {
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
  }, [searchQuery]);

  return (
    <div>
      <h2>Explore</h2>

      <input
        type="text"
        placeholder="Search users, images, albums..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ padding: "10px", width: "80%", marginBottom: "20px" }}
      />

      {/* Users Section */}
      <h3>Users</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {users.map((user) => (
          <div key={user.id} style={{ margin: "10px", cursor: "pointer" }} onClick={() => navigate(`/profile/${user.id}`)}>
            <p>{user.username}</p>
          </div>
        ))}
      </div>

      {/* Images Section */}
      <h3>Images</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {images.map((img) => (
          <div key={img.id} style={{ margin: "10px", position: "relative", cursor: "pointer" }} onClick={() => navigate(`/image/${img.id}`)}>
            <img src={img.image_url} alt={`Image by ${img.posted_by}`} width="150" />
          </div>
        ))}
      </div>

      {/* Albums Section */}
      <h3>Albums</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {albums.map((album) => (
          <div key={album.id} style={{ margin: "10px", cursor: "pointer" }} onClick={() => navigate(`/album/${album.id}`)}>
            <p>{album.name} (by {album.owner})</p>
            <img src={album.cover_image_url} alt={`Album cover for ${album.name}`} width="150" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
