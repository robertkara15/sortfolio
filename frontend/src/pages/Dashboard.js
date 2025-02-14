import React, { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/images/my-images/", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setImages(res.data);
      } catch (error) {
        alert("Failed to fetch images.");
      }
    };
    fetchImages();
  }, []);

  return (
    <div>
      <h2>My Uploaded Images</h2>
      {images.length === 0 ? (
        <p>No images uploaded yet.</p>
      ) : (
        <div>
          {images.map((image) => (
            <div key={image.id}>
              <img src={`http://127.0.0.1:8000${image.image}`} alt="Uploaded" style={{ width: "200px" }} />
              <p><strong>Tags:</strong> {image.tags.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
