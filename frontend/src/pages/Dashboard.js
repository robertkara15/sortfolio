import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Dashboard = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/images/my-images/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setImages(response.data);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };

    fetchImages();
  }, []);

  return (
    <div>
      <h2>My Images</h2>

      {/* Button to go to Upload Page */}
      <button onClick={() => navigate("/upload")} style={uploadButtonStyle}>
        Upload New Images
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
        {images.length === 0 ? (
          <p>No images found.</p>
        ) : (
          images.map((img) => (
            <div key={img.id} style={{ margin: "10px", padding: "10px", border: "1px solid #ddd" }}>
              <img src={img.image_url} alt="Uploaded" style={{ width: "150px", height: "150px", objectFit: "cover" }} />
              <p>Tags: {img.tags?.join(", ") || "No tags"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Style for Upload Button
const uploadButtonStyle = {
  padding: "10px",
  fontSize: "16px",
  marginBottom: "15px",
  cursor: "pointer",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
};

export default Dashboard;
