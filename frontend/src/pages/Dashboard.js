import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const [imageResponse, albumResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/images/my-images/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/images/albums/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setImages(imageResponse.data);
        setAlbums(albumResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const createAlbum = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/images/create-album/",
        { name: newAlbumName, cover_image_id: selectedCoverImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlbums([...albums, { id: response.data.album_id, name: newAlbumName }]);
      setNewAlbumName("");
      setSelectedCoverImage(null);
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => navigate("/upload")} 
        style={{
          padding: "10px",
          fontSize: "16px",
          marginBottom: "15px",
          cursor: "pointer",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Upload New Images
      </button>
      
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
        {albums.map((album) => (
          <div 
            key={album.id} 
            onClick={() => navigate(`/album/${album.id}`)}
            style={{ cursor: "pointer", padding: "10px", border: "1px solid #ddd" }}
          >
            <img src={album.cover_image_url || "default.jpg"} alt="Cover" width="100" />
            <p>{album.name}</p>
          </div>
        ))}
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
