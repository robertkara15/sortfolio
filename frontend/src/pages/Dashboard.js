import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [removeImageMode, setRemoveImageMode] = useState(false);
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
  





  

  

  return (
    <div>
      <div>
      <h2>My Albums</h2>

      <button onClick={() => navigate("/upload")}>Upload Image</button>

      <button onClick={() => setRemoveImageMode(!removeImageMode)}>
        {removeImageMode ? "Exit Remove Mode" : "Remove Images"}
      </button>


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

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {albums.map((album) => (
          <div key={album.id} onClick={() => navigate(`/album/${album.id}`)} style={{ cursor: "pointer", margin: "10px" }}>
            <p>{album.name}</p>
            <img 
              src={album.cover_image_url ? album.cover_image_url : "default.jpg"} 
              alt="Album Cover" 
              width="150"
              onError={(e) => e.target.src = "default.jpg"} 
            />

          </div>
        ))}
      </div>
    </div>

    <button onClick={() => navigate("/analytics")}>View Analytics</button>


      <h2>My Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
        {images.map((img) => (
            <div 
            key={img.id} 
            style={{ margin: "10px", position: "relative", cursor: removeImageMode ? "default" : "pointer" }}
            onClick={() => {
                if (!removeImageMode) {
                    navigate(`/image/${img.id}`);
                }
            }}
        >
            <img 
                src={img.image_url} 
                alt="Uploaded" 
                width="150" 
                onError={(e) => e.target.src = "default.jpg"} 
            />
            
            {removeImageMode && (
                <button 
                    onClick={(event) => {
                        event.stopPropagation(); 
                        deleteImage(img.id);
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    X
                </button>
            )}
        </div>
        
        ))}
    </div>

    <button 
    onClick={deleteAccount} 
    style={{
        padding: "10px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "red",
        color: "white",
        border: "none",
        borderRadius: "5px",
        marginTop: "15px"
    }}
    >
        Delete Account
    </button>

  



    </div>
  );
};

export default Dashboard;
