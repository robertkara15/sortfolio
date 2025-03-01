import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ImageDetail = () => {
  const { imageId } = useParams();
  const [imageData, setImageData] = useState(null);
  const [newTag, setNewTag] = useState("");
  const navigate = useNavigate();

  const fetchImageData = useCallback(async () => {
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
  }, [imageId]);

  const handleEditImageName = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to edit image name.");
        return;
    }

    try {
        await axios.post(
            `http://127.0.0.1:8000/images/image/${imageId}/edit-name/`,
            { name: imageData.name },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Image name updated successfully!");
        } catch (error) {
            console.error("Failed to update image name:", error);
            alert("Failed to update image name.");
        }
    };


  useEffect(() => {
    fetchImageData();
  }, [fetchImageData]);

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.get("http://127.0.0.1:8000/images/albums/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📂 Albums refreshed after tag update");
    } catch (error) {
      console.error("Failed to refresh albums:", error);
    }
  };

  const capitalizeTag = (tag) => {
    return tag
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const formattedTag = capitalizeTag(newTag.trim());
    
    if (imageData.tags.includes(formattedTag)) {
      alert("Tag already exists!");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://127.0.0.1:8000/images/image/${imageId}/edit-tags/`,
        { tags: [...imageData.tags, formattedTag] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setImageData((prev) => ({ ...prev, tags: response.data.tags }));

      await fetchAlbums();

      setNewTag("");
    } catch (error) {
      console.error("Failed to add tag:", error);
      alert("Failed to add tag.");
    }
  };

  const handleRemoveTag = async (tag) => {
    if (imageData.tags.length === 1) {
      alert("An image must have at least one tag.");
      return;
    }

    const updatedTags = imageData.tags.filter((t) => t !== tag);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://127.0.0.1:8000/images/image/${imageId}/edit-tags/`,
        { tags: updatedTags },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setImageData((prev) => ({ ...prev, tags: response.data.tags }));

      await fetchAlbums();
    } catch (error) {
      console.error("Failed to remove tag:", error);
      alert("Failed to remove tag.");
    }
  };

  if (!imageData) return <p>Loading...</p>;

  return (
    <div>
      <h2>Image Details</h2>
      <img src={imageData.image_url} alt="Uploaded" width="300" />
      <p><strong>Image Name:</strong> 
      <input 
          type="text" 
          value={imageData.name} 
          onChange={(e) => setImageData({ ...imageData, name: e.target.value })} 
      />
      <button onClick={handleEditImageName}>Save</button>
      </p>
      <p><strong>Uploaded At:</strong> {imageData.uploaded_at}</p>
      <p><strong>Posted By:</strong> {imageData.posted_by}</p>


      {/* Editable Tags */}
      <h3>Tags</h3>
      <div>
        {imageData.tags.map((tag) => (
          <span key={tag} style={{ marginRight: "10px", background: "#ddd", padding: "5px" }}>
            {tag} 
            <button 
              onClick={() => handleRemoveTag(tag)}
              style={{ marginLeft: "5px", cursor: "pointer", background: "red", color: "white", border: "none", padding: "2px 5px" }}
            >
              X
            </button>
          </span>
        ))}
      </div>

      {/* Add Tag Input */}
      <div style={{ marginTop: "10px" }}>
        <input 
          type="text" 
          value={newTag} 
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter new tag"
        />
        <button onClick={handleAddTag} style={{ marginLeft: "5px" }}>Add Tag</button>
      </div>

      <button onClick={() => navigate(-1)} style={{ marginTop: "15px" }}>Go Back</button>
    </div>
  );
};

export default ImageDetail;
