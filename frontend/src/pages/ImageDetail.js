import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ImageDetail = () => {
  const { imageId } = useParams();
  const [imageData, setImageData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await axios.get(`http://127.0.0.1:8000/images/image/${imageId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setImageData(response.data);
      } catch (error) {
        console.error("Failed to fetch image details:", error);
      }
    };

    fetchImageData();
  }, [imageId]);

  if (!imageData) return <p>Loading...</p>;

  return (
    <div>
      <h2>Image Details</h2>
      <img src={imageData.image_url} alt="Uploaded" width="300" />
      <p><strong>Uploaded At:</strong> {imageData.uploaded_at}</p>
      <p><strong>Tags:</strong> {imageData.tags.join(", ") || "No tags"}</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default ImageDetail;
