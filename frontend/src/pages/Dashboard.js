import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const [albumsResponse, imagesResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/images/albums/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/images/my-images/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAlbums(albumsResponse.data);
        setImages(imagesResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const createNewAlbum = async () => {
    const albumName = prompt("Enter album name:");
    if (!albumName) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://127.0.0.1:8000/images/create-album/",
        { name: albumName, cover_image: null }, // Cover image can be assigned later
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Album created successfully!");
      navigate(`/album/${response.data.album_id}`);
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  

  return (
    <div>
      <button 
        onClick={createNewAlbum} 
        style={{
          padding: "10px",
          fontSize: "16px",
          marginBottom: "15px",
          cursor: "pointer",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Create New Album
      </button>

      <div>
      <h2>My Albums</h2>

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {albums.map((album) => (
          <div key={album.id} onClick={() => navigate(`/album/${album.id}`)} style={{ cursor: "pointer", margin: "10px" }}>
            <p>{album.name}</p>
            <img src={album.cover_image || "default.jpg"} alt="Album Cover" width="150" />
          </div>
        ))}
      </div>
    </div>

      <h2>My Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
        {images.map((img) => (
          <div key={img.id} onClick={() => navigate(`/image/${img.id}`)} style={{ cursor: "pointer", margin: "10px" }}>
            <img src={img.image_url} alt="Uploaded" width="150" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
