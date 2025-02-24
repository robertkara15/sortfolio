import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AlbumPage = () => {
  const { albumId } = useParams();
  const [albumImages, setAlbumImages] = useState([]);
  const [coverImage, setCover] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [addMode, setAddMode] = useState(false); 
  const [removeMode, setRemoveMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }
  
        const [albumResponse, allImagesResponse] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/images/my-images/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        console.log("📸 Album Images Fetched:", albumResponse.data.images);
        console.log("📂 All User Images:", allImagesResponse.data);
  
        setAlbumImages(albumResponse.data.images);
        setAllImages(allImagesResponse.data); 
      } catch (error) {
        console.error("Failed to fetch album data:", error);
        setAlbumImages([]);
        setAllImages([]); 
      }
    };
  
    fetchAlbumData();
  }, [albumId]);

  

  
  

  const addToAlbum = async (imageId) => {
    try {
      const token = localStorage.getItem("token");

      if (albumImages.some((img) => img.id === imageId)) {
        alert("This image is already in the album.");
        return;
      }

      await axios.post(
        `http://127.0.0.1:8000/images/album/${albumId}/`,
        { image_ids: [imageId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Instead of manually adding the image, fetch the updated album images
      const response = await axios.get(`http://127.0.0.1:8000/images/album/${albumId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Updated Album Images:", response.data.images); // Debugging log
      setAlbumImages(response.data.images); // ✅ Update state with latest images

    } catch (error) {
      console.error("Failed to add image to album:", error);
    }
};



  

  const removeFromAlbum = async (imageId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://127.0.0.1:8000/images/album/${albumId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { image_id: imageId },
      });

      setAlbumImages(albumImages.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Failed to remove image from album:", error);
    }
  };

  

  return (
    <div>
      <h2>Album</h2>
      
      {coverImage && (
        <div>
          <h3>Cover Image</h3>
          <img src={coverImage} alt="Cover" width="200" />
        </div>
      )}

    {/* ✅ Toggle Buttons for Modes */}
      <button onClick={() => { setAddMode(!addMode); setRemoveMode(false); }}>
        {addMode ? "Exit Add Mode" : "Add Images to Album"}
      </button>
      <button onClick={() => { setRemoveMode(!removeMode); setAddMode(false); }}>
        {removeMode ? "Exit Remove Mode" : "Remove Images from Album"}
      </button>

    {/* ✅ Album Images (Clickable) */}
    <h3>Album Images</h3>
    <div style={{ display: "flex", flexWrap: "wrap" }}>
    {albumImages && albumImages.length > 0 ? (
        albumImages.map((img) => (
        <div 
            key={img.id} 
            style={{ margin: "10px", cursor: "pointer", padding: "10px", border: removeMode ? "2px solid red" : "1px solid #ddd" }}
            onClick={() => removeMode ? removeFromAlbum(img.id) : navigate(`/image/${img.id}`)}
        >
            <img 
            src={img.image_url || "default.jpg"}  
            alt="Album Content" 
            width="150" 
            onError={(e) => e.target.src = "default.jpg"} 
            />
            <button onClick={() => setCover(img.id)}>Set as Cover</button>
            {removeMode && <p style={{ color: "red" }}>Click to Remove</p>}
        </div>
        ))
    ) : (
        <p>No images in this album.</p>
    )}
    </div>



      {/* ✅ Add Images Mode */}
      {addMode && (
        <>
          <h3>Add Images to Album</h3>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {allImages.map((img) => (
              <div 
                key={img.id} 
                style={{ margin: "10px", cursor: "pointer", padding: "10px", border: "1px solid green" }}
                onClick={() => addToAlbum(img.id)} // ✅ Clicking an image adds it to the album
              >
                <img 
                  src={img.image_url || "default.jpg"}  // ✅ Ensure valid image URL
                  alt="All Images" 
                  width="150" 
                  onError={(e) => e.target.src = "default.jpg"} // ✅ Fallback for broken images
                />
                <p style={{ color: "green" }}>Click to Add</p>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default AlbumPage;
