import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [removeImageMode, setRemoveImageMode] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          navigate("/login");
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
  }, [navigate]);

  const createNewAlbum = async () => {
    const albumName = prompt("Enter album name:");
    if (!albumName) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://127.0.0.1:8000/images/create-album/",
        { name: albumName, cover_image: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Album created successfully!");
      navigate(`/album/${response.data.album_id}`);
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  const deleteImage = async (imageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this image?");
    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("token");

        // Disable interactions to prevent multiple deletions at once
        setImages((prevImages) => prevImages.map(img => 
            img.id === imageId ? { ...img, deleting: true } : img
        ));

        await axios.delete(`http://127.0.0.1:8000/images/delete-image/${imageId}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Remove from state after deletion
        setImages((prevImages) => prevImages.filter(img => img.id !== imageId));

    } catch (error) {
        console.error("Failed to delete image:", error);
        alert("Failed to delete image.");
    }
  };

  



  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>
  
      {/* Dashboard Action Buttons */}
      <div className="dashboard-buttons">
        <button className="upload-btn" onClick={() => navigate("/upload")}>Upload Image</button>
        <button className="remove-btn" onClick={() => setRemoveImageMode(!removeImageMode)}>
          {removeImageMode ? "Exit Remove Mode" : "Remove Images"}
        </button>
        <button className="create-album-btn" onClick={createNewAlbum}>Create New Album</button>
      </div>
  
      {/* My Albums */}
      <h2 className="dashboard-title">My Albums</h2>
      <div className="albums-grid">
        {albums.map((album) => (
          <div key={album.id} className="album-card" onClick={() => navigate(`/album/${album.id}`)}>
            <p>{album.name}</p>
            <img src={album.cover_image_url ? album.cover_image_url : "default.jpg"} alt="Album Cover" onError={(e) => e.target.src = "default.jpg"} />
          </div>
        ))}
      </div>
  
      {/* My Images */}
      <h2 className="dashboard-title">My Images</h2>
      <div className="images-grid">
        {images.map((img) => (
          <div key={img.id} className="image-card" style={{ position: "relative" }} onClick={() => !removeImageMode && navigate(`/image/${img.id}`)}>
            <img src={img.image_url} alt="Uploaded" onError={(e) => e.target.src = "default.jpg"} />
            {removeImageMode && (
              <button className="remove-image-btn" onClick={(event) => {
                event.stopPropagation();
                deleteImage(img.id);
              }}>
                X
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default Dashboard;
